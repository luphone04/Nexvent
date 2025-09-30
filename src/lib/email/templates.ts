interface RegistrationEmailData {
  attendeeName: string
  eventTitle: string
  eventDate: string
  eventTime: string | null
  location: string
  checkInCode: string
  registrationId: string
  qrCodeUrl?: string
}

export function generateRegistrationConfirmationEmail(data: RegistrationEmailData): string {
  const eventDateTime = data.eventTime
    ? `${data.eventDate} at ${data.eventTime}`
    : data.eventDate

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: #2563eb;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border: 1px solid #e5e7eb;
    }
    .event-details {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .qr-code {
      text-align: center;
      margin: 20px 0;
      padding: 20px;
      background: white;
      border-radius: 8px;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-size: 14px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background: #2563eb;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Registration Confirmed! ✅</h1>
  </div>

  <div class="content">
    <p>Hi ${data.attendeeName},</p>

    <p>Thank you for registering! Your registration for <strong>${data.eventTitle}</strong> has been confirmed.</p>

    <div class="event-details">
      <h2>Event Details</h2>
      <p><strong>Event:</strong> ${data.eventTitle}</p>
      <p><strong>Date & Time:</strong> ${eventDateTime}</p>
      <p><strong>Location:</strong> ${data.location}</p>
      <p><strong>Check-in Code:</strong> <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">${data.checkInCode}</code></p>
    </div>

    ${data.qrCodeUrl ? `
    <div class="qr-code">
      <h3>Your Event Ticket</h3>
      <p>Present this QR code at the event entrance:</p>
      <img src="${data.qrCodeUrl}" alt="Event QR Code" style="max-width: 250px; height: auto;" />
      <p style="font-size: 14px; color: #6b7280;">Save this email or download the QR code for offline access</p>
    </div>
    ` : ''}

    <div style="text-align: center; margin: 20px 0;">
      <a href="${process.env.NEXTAUTH_URL}/registrations/${data.registrationId}/confirmation" class="button">
        View Registration Details
      </a>
    </div>

    <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0;">What's Next?</h3>
      <ul style="margin: 0; padding-left: 20px;">
        <li>Save your QR code for easy check-in</li>
        <li>Add the event to your calendar</li>
        <li>You'll receive a reminder before the event</li>
      </ul>
    </div>

    <p>If you need to make any changes to your registration, please visit your dashboard or contact the event organizer.</p>

    <p>See you at the event!</p>

    <p>Best regards,<br>The Nexvent Team</p>
  </div>

  <div class="footer">
    <p>This is an automated email. Please do not reply to this message.</p>
    <p>&copy; ${new Date().getFullYear()} Nexvent. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim()
}

export function generateWaitlistConfirmationEmail(data: Omit<RegistrationEmailData, 'checkInCode' | 'qrCodeUrl'>): string {
  const eventDateTime = data.eventTime
    ? `${data.eventDate} at ${data.eventTime}`
    : data.eventDate

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: #f59e0b;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border: 1px solid #e5e7eb;
    }
    .event-details {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Added to Waitlist ⏳</h1>
  </div>

  <div class="content">
    <p>Hi ${data.attendeeName},</p>

    <p>Thank you for your interest in <strong>${data.eventTitle}</strong>! The event is currently at full capacity, but you have been added to the waitlist.</p>

    <div class="event-details">
      <h2>Event Details</h2>
      <p><strong>Event:</strong> ${data.eventTitle}</p>
      <p><strong>Date & Time:</strong> ${eventDateTime}</p>
      <p><strong>Location:</strong> ${data.location}</p>
    </div>

    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0;">What Happens Next?</h3>
      <ul style="margin: 0; padding-left: 20px;">
        <li>If a spot becomes available, you'll be automatically promoted</li>
        <li>We'll send you an email notification immediately</li>
        <li>You can check your waitlist status in your dashboard</li>
      </ul>
    </div>

    <p>We'll keep you updated on your waitlist status. Thank you for your patience!</p>

    <p>Best regards,<br>The Nexvent Team</p>
  </div>

  <div class="footer">
    <p>This is an automated email. Please do not reply to this message.</p>
    <p>&copy; ${new Date().getFullYear()} Nexvent. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim()
}