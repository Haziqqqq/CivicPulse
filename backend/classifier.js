const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

const BACKEND_ROOT = __dirname
const INFER_SCRIPT = path.join(BACKEND_ROOT, 'ai', 'infer.py')

const PRIORITY_TO_SEVERITY = {
  P1: 'critical',
  P2: 'high',
  P3: 'medium',
  P4: 'low',
  REVIEW: 'medium',
  NONE: 'medium',
}

function aiEnabled() {
  return process.env.AI_ENABLED !== 'false' && process.env.INFERENCE_ENABLED !== 'false'
}

function keywordClassify(description = '') {
  const text = description.toLowerCase()
  let issue_type = 'other'
  let severity = 'medium'

  if (text.match(/pothole|hole|crack|road|tarmac|asphalt/)) {
    issue_type = 'pothole'
    severity = text.match(/large|huge|big|deep|severe|dangerous/) ? 'critical' : 'medium'
  } else if (text.match(/flood|water|drain|puddle|overflow|waterlog/)) {
    issue_type = 'flooding'
    severity = text.match(/road|impass|block|cover/) ? 'critical' : 'high'
  } else if (text.match(/light|lamp|streetlight|dark|broken light|no light/)) {
    issue_type = 'streetlight'
    severity = text.match(/school|hospital|junction|many/) ? 'high' : 'medium'
  } else if (text.match(/garbage|trash|rubbish|waste|bin|litter|dump/)) {
    issue_type = 'garbage'
    severity = text.match(/large|everywhere|overflow|week/) ? 'high' : 'low'
  } else if (text.match(/vandal|graffiti|damage|broken|destroy|smash/)) {
    issue_type = 'vandalism'
    severity = 'medium'
  }

  if (text.match(/urgent|emergency|accident|dangerous|critical|immediately/)) {
    severity = 'critical'
  }

  const notes =
    issue_type === 'other'
      ? 'Classified from description keywords — manual review recommended'
      : `Classified as ${issue_type} (${severity}) from description keywords`

  return {
    issue_type,
    severity,
    confidence: 0.5,
    notes,
    repair_priority: 'NONE',
    detections: [],
    source: 'keywords',
  }
}

function mergeVisionAndKeywords(vision, keywords) {
  if (!vision || !vision.ok) return keywords

  const hasDetections = vision.detections && vision.detections.length > 0
  if (hasDetections) return { ...vision, source: 'yolo' }

  if (keywords.issue_type !== 'other') {
    return {
      ...keywords,
      notes: `${vision.notes || 'YOLO found nothing.'} Using description: ${keywords.notes}`,
      source: 'keywords_fallback',
    }
  }

  return { ...vision, source: 'yolo' }
}

function runPythonInfer(imagePath, roadClass = 'unknown') {
  return new Promise((resolve, reject) => {
    const python = process.env.AI_PYTHON || 'python'
    const weights = process.env.AI_MODEL_PATH || path.join(BACKEND_ROOT, 'models', 'best.pt')
    const conf = process.env.AI_CONF || '0.25'
    const args = [
      INFER_SCRIPT,
      imagePath,
      '--weights',
      weights,
      '--conf',
      conf,
      '--road-class',
      roadClass,
    ]

    const proc = spawn(python, args, {
      cwd: BACKEND_ROOT,
      windowsHide: true,
    })

    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (d) => { stdout += d.toString() })
    proc.stderr.on('data', (d) => { stderr += d.toString() })

    const timeoutMs = parseInt(process.env.INFERENCE_TIMEOUT_MS || '120000', 10)
    const timer = setTimeout(() => {
      proc.kill()
      reject(new Error(`AI inference timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    proc.on('close', (code) => {
      clearTimeout(timer)
      if (code !== 0) {
        reject(new Error(stderr || `infer.py exited with code ${code}`))
        return
      }
      try {
        const line = stdout.trim().split('\n').pop()
        resolve(JSON.parse(line))
      } catch (e) {
        reject(new Error(`Failed to parse AI output: ${stdout.slice(0, 200)}`))
      }
    })
  })
}

async function runHttpInfer(imagePath, roadClass = 'unknown') {
  const FormData = require('form-data')
  const base = (process.env.INFERENCE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')
  const conf = process.env.AI_CONF || '0.25'
  const timeoutMs = parseInt(process.env.INFERENCE_TIMEOUT_MS || '120000', 10)

  const form = new FormData()
  form.append('file', fs.createReadStream(imagePath), {
    filename: path.basename(imagePath),
    contentType: 'image/jpeg',
  })
  form.append('road_class', roadClass)
  form.append('conf', String(conf))

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(`${base}/predict`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
      signal: controller.signal,
    })
    clearTimeout(timer)
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Inference HTTP ${res.status}: ${text.slice(0, 200)}`)
    }
    return res.json()
  } catch (err) {
    clearTimeout(timer)
    throw err
  }
}

async function classifyWithVision(imagePath, description, roadClass) {
  const useHttp = process.env.INFERENCE_MODE === 'http'

  let vision
  if (useHttp) {
    vision = await runHttpInfer(imagePath, roadClass)
  } else {
    vision = await runPythonInfer(imagePath, roadClass)
  }

  const keywords = keywordClassify(description)
  const merged = mergeVisionAndKeywords(vision, keywords)

  return {
    issue_type: merged.issue_type || 'other',
    severity: merged.severity || PRIORITY_TO_SEVERITY[merged.repair_priority] || 'medium',
    confidence: merged.confidence ?? 0,
    notes: merged.notes || '',
    repair_priority: merged.repair_priority || 'NONE',
    detections: merged.detections || [],
    ai_source: merged.source || 'yolo',
  }
}

async function classifyImage(imagePath, description = '', options = {}) {
  const roadClass = options.road_class || 'unknown'
  const keywords = keywordClassify(description)

  if (!aiEnabled()) {
    return { ...keywords, ai_source: 'keywords_disabled' }
  }

  if (imagePath && fs.existsSync(imagePath)) {
    try {
      return await classifyWithVision(imagePath, description, roadClass)
    } catch (err) {
      console.error('AI classification failed:', err.message)
      return {
        ...keywords,
        notes: `AI unavailable (${err.message}). ${keywords.notes}`,
        ai_source: 'keywords_ai_error',
      }
    }
  }

  if (description) {
    return { ...keywords, ai_source: 'keywords' }
  }

  return {
    issue_type: 'other',
    severity: 'medium',
    confidence: 0,
    notes: 'No photo or description provided.',
    repair_priority: 'NONE',
    detections: [],
    ai_source: 'none',
  }
}

module.exports = { classifyImage, keywordClassify }
