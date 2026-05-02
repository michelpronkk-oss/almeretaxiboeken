import "server-only"
import { sendEmail } from "@/lib/email/send"
import { chauffeurInviteEmail } from "@/lib/email/templates"

interface InviteEmailParams {
  to: string
  onboardingUrl: string
}

export async function sendDriverInviteEmail({ to, onboardingUrl }: InviteEmailParams) {
  const mail = chauffeurInviteEmail(onboardingUrl)
  return sendEmail({
    from: process.env.DRIVER_INVITE_FROM_EMAIL || process.env.RESEND_FROM_EMAIL,
    to,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  })
}
