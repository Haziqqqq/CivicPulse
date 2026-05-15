const Anthropic = require('@anthropic-ai/sdk')
const fs = require('fs')
require('dotenv').config()

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function classifyImage(imagePath, description = '') {
  try {
    const imageData = fs.readFileSync(imagePath)
    const base64 = imageData.toString('base64')
    const ext = imagePath.split('.').pop().toLowerCase()
    const mediaType = ext === 'png' ? 'image/png' 
    : ext === 'webp' ? 'image/webp' 
    : 'image/jpeg'

    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 }
          },
          {
            type: 'text',
            text: `You are a civic infrastructure analyst.
Analyse this photo of a public street issue.
Citizen description: "${description}"

Respond in JSON only, no extra text:
{
  "issue_type": "pothole|streetlight|flooding|garbage|vandalism|other",
  "severity": "low|medium|high|critical",
  "confidence": 0.0-1.0,
  "notes": "one sentence description of what you see"
}`
          }
        ]
      }]
    })

    const text = response.content[0].text.trim()
    console.log('Claude response:', text)
    return JSON.parse(text)

  } catch (err) {
    console.error('Classification error:', err.message)
    // Fallback if Claude fails
    return {
      issue_type: 'other',
      severity: 'medium',
      confidence: 0.0,
      notes: 'Auto-classification failed, manual review needed'
    }
  }
}

module.exports = { classifyImage }