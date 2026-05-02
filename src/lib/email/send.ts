import "server-only"
import { Resend } from "resend"

export interface SendEmailPayload {
  to: string | string[]
  subject: string
  html: string
  text: string
  from?: string
}

export async function sendEmail(payload: SendEmailPayload) {
  const apiKey = process.env.RESEND_API_KEY
  const fallbackFrom = process.env.RESEND_FROM_EMAIL
  const from = payload.from || fallbackFrom

  if (!apiKey || !from) {
    return { sent: false as const, reason: "missing_config" as const }
  }

  const resend = new Resend(apiKey)
  await resend.emails.send({
    from,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  })

  return { sent: true as const }
}
