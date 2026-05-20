const { Resend } = require('resend')
require('dotenv').config()

const resend = new Resend(process.env.RESEND_API_KEY)

const departmentEmails = {
  'Roads Department': 'roads@civicpulse.gov.bn',
  'Drainage Department': 'drainage@civicpulse.gov.bn',
  'Utilities Department': 'utilities@civicpulse.gov.bn',
  'Sanitation Department': 'sanitation@civicpulse.gov.bn',
  'Public Safety Department': 'safety@civicpulse.gov.bn',
  'General Maintenance': 'maintenance@civicpulse.gov.bn',
}

async function sendReportNotification(report) {
  const toEmail = departmentEmails[report.department] || 'admin@civicpulse.gov.bn'

  const severityColors = {
    critical: '#dc2626',
    high: '#ea580c',
    medium: '#d97706',
    low: '#16a34a'
  }
  const color = severityColors[report.severity] || '#6b7280'

  try {
    await resend.emails.send({
      from: 'CivicPulse <notifications@civicpulse.gov.bn>',
      to: toEmail,
      subject: `[${report.severity.toUpperCase()}] New ${report.issue_type} report — ${report.address}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0d0d0d; padding: 24px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 20px;">⚡ CivicPulse</h1>
            <p style="color: rgba(255,255,255,0.5); margin: 4px 0 0; font-size: 13px;">Infrastructure Report Notification</p>
          </div>

          <div style="background: white; border: 1px solid #e5e7eb; border-top: none; padding: 32px; border-radius: 0 0 8px 8px;">
            <div style="display: inline-block; background: ${color}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 20px;">
              ${report.severity} severity
            </div>

            <h2 style="margin: 0 0 24px; font-size: 22px; color: #111827; text-transform: capitalize;">
              New ${report.issue_type} Report
            </h2>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 12px 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; width: 140px;">Issue Type</td>
                <td style="padding: 12px 0; font-size: 14px; color: #111827; font-weight: 500; text-transform: capitalize;">${report.issue_type}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 12px 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Location</td>
                <td style="padding: 12px 0; font-size: 14px; color: #111827;">${report.address}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 12px 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Department</td>
                <td style="padding: 12px 0; font-size: 14px; color: #111827;">${report.department}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 12px 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">SLA Deadline</td>
                <td style="padding: 12px 0; font-size: 14px; color: #111827; font-weight: 500;">${new Date(report.sla_deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 12px 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Filed At</td>
                <td style="padding: 12px 0; font-size: 14px; color: #111827;">${new Date(report.created_at).toLocaleString('en-GB')}</td>
              </tr>
              ${report.description ? `
              <tr>
                <td style="padding: 12px 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Description</td>
                <td style="padding: 12px 0; font-size: 14px; color: #111827;">${report.description}</td>
              </tr>
              ` : ''}
            </table>

            <a href="${process.env.FRONTEND_URL}/admin" 
               style="display: inline-block; background: #e63329; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600;">
              View in Admin Dashboard →
            </a>

            <p style="margin: 24px 0 0; font-size: 12px; color: #9ca3af; line-height: 1.6;">
              This report has been automatically routed to your department based on the issue type.
              Please log in to the admin dashboard to update the status and resolve the issue before the SLA deadline.
            </p>
          </div>
        </div>
      `
    })
    console.log(`📧 Email sent to ${toEmail} for ${report.issue_type} report`)
  } catch (err) {
    console.error('Email send failed:', err.message)
  }
}

module.exports = { sendReportNotification }