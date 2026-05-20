async function classifyImage(imagePath, description = '') {
  const text = description.toLowerCase()
  const filename = imagePath.toLowerCase()

  let issue_type = 'other'
  let severity = 'medium'

  // Keyword-based classification from description
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

  // Override severity based on urgency words
  if (text.match(/urgent|emergency|accident|dangerous|critical|immediately/)) {
    severity = 'critical'
  }

  const notes = issue_type === 'other'
    ? 'Could not classify from description — manual review recommended'
    : `Classified as ${issue_type} (${severity}) based on description keywords`

  return { issue_type, severity, confidence: 0.7, notes }
}

module.exports = { classifyImage }