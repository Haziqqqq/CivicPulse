const express = require('express')
const cors = require('cors')
const { Pool } = require('pg')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { classifyImage } = require('./classifier')
const { sendReportNotification } = require('./emailService')
require('dotenv').config()

const app = express()
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://civicpulse-omega.vercel.app',
    /\.vercel\.app$/
  ]
}))
app.use(express.json())

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads'
    if (!fs.existsSync(dir)) fs.mkdirSync(dir)
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname))
  }
})
const upload = multer({ storage })

app.use('/uploads', express.static('uploads'))

// Calculate distance between two coordinates in metres (Haversine formula)
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Smart merge radius per issue type (in metres)
const mergeRadius = {
  pothole: 30,
  streetlight: 50,
  flooding: 150,
  garbage: 40,
  vandalism: 20,
  other: 50
}

// GET /reports/department/:dept — get reports for a specific department
app.get('/reports/department/:dept', async (req, res) => {
  try {
    const { dept } = req.params
    const result = await db.query(`
      SELECT id, issue_type, severity, status, description,
             address, department, sla_deadline, created_at,
             resolved_at, photo_url, latitude, longitude, notes,
             duplicate_count, original_report_id
      FROM reports
      WHERE department = $1
      ORDER BY created_at DESC
    `, [dept])
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Health check
app.get('/health', async (req, res) => {
  const result = await db.query('SELECT NOW()')
  res.json({ status: 'ok', time: result.rows[0].now })
})

// POST /reports — submit a new report with smart duplicate detection
app.post('/reports', upload.single('photo'), async (req, res) => {
  try {
    const { description, latitude, longitude, address } = req.body
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null

    // Classify the image
    let classification = { issue_type: 'other', severity: 'medium', notes: '' }
    if (req.file) {
      classification = await classifyImage(req.file.path, description || '')
    } else if (description) {
      classification = await classifyImage('', description)
    }
    const issueType = classification.issue_type

    // Get routing rule
    const ruleResult = await db.query(
      'SELECT * FROM routing_rules WHERE issue_type = $1',
      [issueType]
    )
    const rule = ruleResult.rows[0] || { department: 'General Maintenance', sla_hours: 72 }

    // Calculate SLA deadline
    const slaDeadline = new Date()
    slaDeadline.setHours(slaDeadline.getHours() + rule.sla_hours)

    // Smart duplicate detection — check for same issue type nearby within 7 days
    const radius = mergeRadius[issueType] || 50

    let duplicateOf = null

    if (latitude && longitude) {
      const nearbyReports = await db.query(`
        SELECT id, latitude, longitude, issue_type, duplicate_count, severity
        FROM reports
        WHERE issue_type = $1
          AND status != 'resolved'
          AND original_report_id IS NULL
          AND latitude IS NOT NULL
          AND longitude IS NOT NULL
          AND created_at > NOW() - INTERVAL '7 days'
      `, [issueType])

      for (const existing of nearbyReports.rows) {
        const dist = getDistance(
          parseFloat(latitude), parseFloat(longitude),
          parseFloat(existing.latitude), parseFloat(existing.longitude)
        )

        if (dist <= radius) {
          duplicateOf = existing
          break
        }
      }
    }

    // If duplicate found — increment counter and link to original
    if (duplicateOf) {
      // Upgrade severity if new report is more severe
      const severityRank = { low: 1, medium: 2, high: 3, critical: 4 }
      const existingRank = severityRank[duplicateOf.severity] || 1
      const newRank = severityRank[classification.severity] || 1

      if (newRank > existingRank) {
        await db.query(
          `UPDATE reports SET severity = $1 WHERE id = $2`,
          [classification.severity, duplicateOf.id]
        )
      }

      // Increment duplicate count
      await db.query(
        `UPDATE reports SET duplicate_count = duplicate_count + 1 WHERE id = $1`,
        [duplicateOf.id]
      )

      // Save as linked duplicate
      const result = await db.query(
        `INSERT INTO reports
         (issue_type, severity, description, photo_url, latitude, longitude,
          address, department, sla_deadline, original_report_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          issueType, classification.severity, description, photoUrl,
          latitude, longitude, address, rule.department,
          slaDeadline, duplicateOf.id
        ]
      )

      return res.json({
        ...result.rows[0],
        ai_notes: classification.notes,
        is_duplicate: true,
        original_id: duplicateOf.id,
        duplicate_count: duplicateOf.duplicate_count + 1,
        message: `This issue has already been reported ${duplicateOf.duplicate_count + 1} time(s) nearby. Your report has been added to strengthen the case for faster resolution.`
      })
    }

    // No duplicate — create fresh report
    const result = await db.query(
      `INSERT INTO reports
       (issue_type, severity, description, photo_url, latitude, longitude,
        address, department, sla_deadline, duplicate_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0)
       RETURNING *`,
      [
        issueType, classification.severity, description, photoUrl,
        latitude, longitude, address, rule.department, slaDeadline
      ]
    )

    // Send email notification to department
    sendReportNotification(result.rows[0])

    res.json({
      ...result.rows[0],
      ai_notes: classification.notes,
      is_duplicate: false
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// GET /reports — fetch all reports for the map
app.get('/reports', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, issue_type, severity, status, description,
             address, department, sla_deadline, created_at,
             resolved_at, photo_url, latitude, longitude, notes,
             duplicate_count, original_report_id
      FROM reports
      ORDER BY created_at DESC
    `)
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// GET /reports/:id — get single report
app.get('/reports/:id', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM reports WHERE id = $1',
      [req.params.id]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /reports/:id/status — update report status
app.patch('/reports/:id/status', async (req, res) => {
  try {
    const { id } = req.params
    const { status, notes } = req.body

    const result = await db.query(
      `UPDATE reports
       SET status = $1::text,
           notes = COALESCE($2::text, notes),
           resolved_at = CASE WHEN $1::text = 'resolved' THEN NOW() ELSE resolved_at END
       WHERE id = $3
       RETURNING *`,
      [status, notes || null, id]
    )

    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })

    if (status === 'resolved') {
      const report = result.rows[0]
      const missed = new Date() > new Date(report.sla_deadline)
      if (missed) {
        await db.query(
          `UPDATE authorities SET missed_sla_count = missed_sla_count + 1 WHERE department = $1`,
          [report.department]
        )
      } else {
        await db.query(
          `UPDATE authorities SET resolved_count = resolved_count + 1 WHERE department = $1`,
          [report.department]
        )
      }
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// PATCH /reports/:id/resolve — mark a report as resolved (legacy)
app.patch('/reports/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params
    const now = new Date()

    const reportResult = await db.query(
      'SELECT * FROM reports WHERE id = $1', [id]
    )
    if (reportResult.rows.length === 0) return res.status(404).json({ error: 'Not found' })

    const report = reportResult.rows[0]
    const missedSla = now > new Date(report.sla_deadline)

    await db.query(
      `UPDATE reports SET status = 'resolved', resolved_at = $1 WHERE id = $2`,
      [now, id]
    )

    if (missedSla) {
      await db.query(
        `UPDATE authorities SET missed_sla_count = missed_sla_count + 1 WHERE department = $1`,
        [report.department]
      )
    } else {
      await db.query(
        `UPDATE authorities SET resolved_count = resolved_count + 1 WHERE department = $1`,
        [report.department]
      )
    }

    res.json({ success: true, missed_sla: missedSla })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// GET /authorities/scorecard — leaderboard
app.get('/authorities/scorecard', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT name, department,
             resolved_count, missed_sla_count,
             CASE
               WHEN (resolved_count + missed_sla_count) = 0 THEN 0
               ELSE ROUND(
                 resolved_count::numeric /
                 (resolved_count + missed_sla_count) * 100
               )
             END as score_pct
      FROM authorities
      ORDER BY score_pct DESC
    `)
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// GET /staff/me — get staff profile by email
app.get('/staff/me', async (req, res) => {
  try {
    const { email } = req.query
    if (!email) return res.status(400).json({ error: 'Email required' })
    const result = await db.query(
      'SELECT * FROM staff WHERE email = $1',
      [email]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Staff not found' })
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`CivicPulse backend running on port ${PORT}`)
})