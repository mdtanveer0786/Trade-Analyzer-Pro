import nodemailer from 'nodemailer'

const templates = {
  'verify-email': (context) => ({
    subject: 'Verify your email - TradeAnalyzer',
    html: `
  <div style="font-family: Arial; max-width: 600px; margin: auto;">
    <h2 style="color:#3B82F6;">Verify your email</h2>
    <p>Hi ${context.name},</p>
    <p>Please verify your email to activate your TradeAnalyzer account.</p>
    <a href="${context.verifyUrl}"
       style="display:inline-block;background:#3B82F6;color:white;
       padding:12px 20px;border-radius:6px;text-decoration:none;">
       Verify Email
    </a>
    <p>This link will expire in 24 hours.</p>
    <p>— TradeAnalyzer Team</p>
  </div>
  `,
  }),

  welcome: (context) => ({
    subject: 'Welcome to TradeAnalyzer!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3B82F6;">Welcome to TradeAnalyzer, ${context.name}! 🎉</h2>
        <p>Thank you for joining India's most advanced trading journal platform.</p>
        <p>With TradeAnalyzer, you can:</p>
        <ul>
          <li>Track and analyze all your trades in one place</li>
          <li>Get AI-powered insights on your trading patterns</li>
          <li>Improve your strategy with advanced analytics</li>
          <li>Identify psychological patterns affecting your performance</li>
        </ul>
        <p>Ready to transform your trading? <a href="${process.env.CLIENT_URL}/app/dashboard" style="color: #3B82F6;">Start journaling your trades now!</a></p>
        <p>Best regards,<br>The TradeAnalyzer Team</p>
      </div>
    `,
  }),
  'password-reset': (context) => ({
    subject: 'Password Reset Request - TradeAnalyzer',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3B82F6;">Password Reset Request</h2>
        <p>Hi ${context.name},</p>
        <p>You requested to reset your password. Click the link below to set a new password:</p>
        <p><a href="${context.resetUrl}" style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Reset Password</a></p>
        <p>This link will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>The TradeAnalyzer Team</p>
      </div>
    `,
  }),
  'password-reset-success': (context) => ({
    subject: 'Password Reset Successful - TradeAnalyzer',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10B981;">Password Reset Successful! ✅</h2>
        <p>Hi ${context.name},</p>
        <p>Your password has been successfully reset.</p>
        <p>If you did not make this change, please contact our support team immediately at <a href="mailto:support@tradeanalyzer.in" style="color: #3B82F6;">support@tradeanalyzer.in</a>.</p>
        <p><a href="${process.env.CLIENT_URL}/login" style="color: #3B82F6;">Login to your account</a></p>
        <p>Best regards,<br>The TradeAnalyzer Team</p>
      </div>
    `,
  }),
  'weekly-report': (context) => ({
    subject: `Your Weekly Trading Report - ${context.week}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3B82F6;">Weekly Trading Report 📊</h2>
        <p>Hi ${context.name},</p>
        <p>Here's your trading performance report for ${context.week}:</p>
        
        <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Performance Summary</h3>
          <p><strong>Total Trades:</strong> ${context.totalTrades}</p>
          <p><strong>Win Rate:</strong> ${context.winRate}%</p>
          <p><strong>Total P&L:</strong> ₹${context.totalPnL}</p>
          <p><strong>Profit Factor:</strong> ${context.profitFactor}</p>
        </div>
        
        <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">AI Insights</h3>
          ${context.aiInsights}
        </div>
        
        <p><a href="${process.env.CLIENT_URL}/app/analytics" style="color: #3B82F6;">View detailed analytics in your dashboard</a></p>
        <p>Best regards,<br>The TradeAnalyzer Team</p>
      </div>
    `,
  }),
}

export const sendEmail = async ({ to, subject, template, context }) => {
  try {
    const templateData = templates[template](context)

    // Build transporter dynamically so we can fallback gracefully
    let transporter
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    } else {
      // No SMTP configured: create an Ethereal test account so emails don't crash flows
      const testAccount = await nodemailer.createTestAccount()
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      })
    }

    const mailOptions = {
      from: `"TradeAnalyzer" <${process.env.SMTP_USER || 'no-reply@tradeanalyzer.local'}>`,
      to,
      subject: subject || templateData.subject,
      html: templateData.html,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log(`Email send attempt to ${to}:`, info.messageId || info)

    // If using Ethereal, log preview URL to console
    try {
      const preview = nodemailer.getTestMessageUrl(info)
      if (preview) console.log(`Preview URL: ${preview}`)
    } catch (e) {
      // ignore
    }

    return { success: true, info }
  } catch (error) {
    console.error('Error sending email:', error)
    // Don't throw to avoid breaking main flows (e.g., registration)
    return { success: false, error }
  }
}