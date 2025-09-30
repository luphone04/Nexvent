interface EmailOptions {
  to: string
  subject: string
  html: string
}

/**
 * Send email function
 *
 * For development: logs email to console
 * For production: integrate with email service (Resend, SendGrid, etc.)
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // In development, just log the email
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Email would be sent:')
      console.log('To:', options.to)
      console.log('Subject:', options.subject)
      console.log('---')

      // You can uncomment below to see full HTML in logs
      // console.log('HTML:', options.html)

      return true
    }

    // In production, integrate with actual email service
    // Example with Resend:
    /*
    const { Resend } = require('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    await resend.emails.send({
      from: 'noreply@nexvent.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
    })
    */

    // Example with SendGrid:
    /*
    const sgMail = require('@sendgrid/mail')
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)

    await sgMail.send({
      to: options.to,
      from: 'noreply@nexvent.com',
      subject: options.subject,
      html: options.html,
    })
    */

    return true
  } catch (error) {
    console.error('Email sending failed:', error)
    return false
  }
}

/**
 * Send registration confirmation email with QR code
 */
export async function sendRegistrationConfirmation(
  to: string,
  data: {
    attendeeName: string
    eventTitle: string
    eventDate: string
    checkInCode: string
    registrationId: string
  }
): Promise<boolean> {
  const subject = `Registration Confirmed: ${data.eventTitle}`

  // Import template
  const { generateRegistrationConfirmationEmail } = await import('./templates')

  const html = generateRegistrationConfirmationEmail({
    ...data,
    eventTime: null,
    location: '',
  })

  return sendEmail({ to, subject, html })
}

/**
 * Send waitlist confirmation email
 */
export async function sendWaitlistConfirmation(
  to: string,
  data: {
    attendeeName: string
    eventTitle: string
    eventDate: string
    registrationId: string
  }
): Promise<boolean> {
  const subject = `Waitlist Confirmation: ${data.eventTitle}`

  const { generateWaitlistConfirmationEmail } = await import('./templates')

  const html = generateWaitlistConfirmationEmail({
    ...data,
    eventTime: null,
    location: '',
  })

  return sendEmail({ to, subject, html })
}