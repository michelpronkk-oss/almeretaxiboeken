import "server-only"
import { sendEmail } from "@/lib/email/send"
import { chauffeurApprovedEmail, chauffeurLoginLinkEmail } from "@/lib/email/templates"

function sender() {
  return process.env.DRIVER_INVITE_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || ""
}

function siteUrl() {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "")
  if (process.env.NODE_ENV === "production" && /localhost/i.test(configured)) {
    return "https://www.almeretaxiboeken.nl"
  }
  return configured
}

export async function sendDriverApprovedEmail(to: string, accessToken: string) {
  const accessUrl = `${siteUrl()}/chauffeur/access?token=${encodeURIComponent(accessToken)}`
  const mail = chauffeurApprovedEmail(accessUrl)

  return sendEmail({
    from: sender(),
    to,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  })
}

export async function sendDriverLoginLinkEmail(to: string, accessToken: string) {
  const accessUrl = `${siteUrl()}/chauffeur/access?token=${encodeURIComponent(accessToken)}`
  const mail = chauffeurLoginLinkEmail(accessUrl)
  const subject = "Uw inloglink voor AlmereTaxiBoeken"

  return sendEmail({
    from: sender(),
    to,
    subject,
    html: mail.html,
    text: mail.text,
  })
}
