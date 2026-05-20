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
app.use(cors())
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

// Health check
app.get('/health', async (req, res) => {
  const result = await db.query('SELECT NOW()')
  res.json({ status: 'ok', time: result.rows[0].now })
})

// POST /reports — submit a new report
app.post('/reports', upload.single('photo'), async (req, res) => {
  try {
    const { description, latitude, longitude, address } = req.body
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null

    let classification = { issue_type: 'other', severity: 'medium', notes: '' }
    if (req.file) {
      classification = await classifyImage(req.file.path, description || '')
    }
    const issueType = classification.issue_type

    const ruleResult = await db.query(
      'SELECT * FROM routing_rules WHERE issue_type = $1',
      [issueType]
    )
    const rule = ruleResult.rows[0] || { department: 'General Maintenance', sla_hours: 72 }

    const slaDeadline = new Date()
    slaDeadline.setHours(slaDeadline.getHours() + rule.sla_hours)

    const result = await db.query(
      `INSERT INTO reports
       (issue_type, severity, description, photo_url, latitude, longitude, address, department, sla_deadline)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        issueType,
        classification.severity,
        description,
        photoUrl,
        latitude,
        longitude,
        address,
        rule.department,
        slaDeadline
      ]
    )
    // Send email notification to department
    sendReportNotification(result.rows[0])

    res.json({ ...result.rows[0], ai_notes: classification.notes })
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
             resolved_at, photo_url, latitude, longitude, notes
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

// GET /reports/department/:dept — get reports for a specific department
app.get('/reports/department/:dept', async (req, res) => {
  try {
    const { dept } = req.params
    const result = await db.query(`
      SELECT id, issue_type, severity, status, description,
             address, department, sla_deadline, created_at,
             resolved_at, photo_url, latitude, longitude, notes
      FROM reports
      WHERE department = $1
      ORDER BY created_at DESC
    `, [dept])
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`CivicPulse backend running on port ${PORT}`)
})