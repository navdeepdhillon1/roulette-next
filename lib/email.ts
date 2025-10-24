/**
 * Email service using Resend
 *
 * Docs: https://resend.com/docs/send-with-nodejs
 */

export interface SendEmailParams {
  to: string | string[]
  subject: string
  html: string
  from?: string
}

export async function sendEmail({ to, subject, html, from }: SendEmailParams) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY

  if (!RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not configured - email not sent')
    return { success: false, error: 'Email service not configured' }
  }

  const fromAddress = from || process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: fromAddress,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('[Email] Failed to send:', data)
      return { success: false, error: data.message || 'Failed to send email' }
    }

    console.log('[Email] Sent successfully:', data.id)
    return { success: true, id: data.id }

  } catch (error: any) {
    console.error('[Email] Error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Email templates
 */

export function getNewSubscriptionEmail(subscription: {
  customerEmail: string
  tier: string
  amount: number
  interval: string
}) {
  return {
    subject: `🎉 New ${subscription.tier.toUpperCase()} Subscription!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .detail { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #667eea; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎰 New Subscription Alert!</h1>
            </div>
            <div class="content">
              <h2>You have a new subscriber!</h2>

              <div class="detail">
                <strong>Customer:</strong> ${subscription.customerEmail}
              </div>

              <div class="detail">
                <strong>Plan:</strong> ${subscription.tier.toUpperCase()}
              </div>

              <div class="detail">
                <strong>Amount:</strong> $${subscription.amount / 100}/${subscription.interval}
              </div>

              <div class="detail">
                <strong>Status:</strong> ✅ Active
              </div>

              <p style="margin-top: 20px;">
                View in <a href="https://dashboard.stripe.com/subscriptions" style="color: #667eea;">Stripe Dashboard</a>
              </p>
            </div>
            <div class="footer">
              <p>Roulette Tracker Pro - Automated Notification</p>
              <p>You're receiving this because you're the owner of the application.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }
}

export function getSubscriptionCanceledEmail(subscription: {
  customerEmail: string
  tier: string
}) {
  return {
    subject: `❌ Subscription Canceled - ${subscription.tier.toUpperCase()}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .detail { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #f5576c; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>❌ Subscription Canceled</h1>
            </div>
            <div class="content">
              <h2>A customer has canceled their subscription</h2>

              <div class="detail">
                <strong>Customer:</strong> ${subscription.customerEmail}
              </div>

              <div class="detail">
                <strong>Plan:</strong> ${subscription.tier.toUpperCase()}
              </div>

              <div class="detail">
                <strong>Status:</strong> ❌ Canceled
              </div>

              <p style="margin-top: 20px;">
                View details in <a href="https://dashboard.stripe.com/customers" style="color: #f5576c;">Stripe Dashboard</a>
              </p>
            </div>
            <div class="footer">
              <p>Roulette Tracker Pro - Automated Notification</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }
}
