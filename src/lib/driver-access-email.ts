import "server-only"
import { Resend } from "resend"

function sender() {
  return process.env.DRIVER_INVITE_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || ""
}

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "")
}

async function sendEmail(params: { to: string; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY
  const from = sender()
  if (!apiKey || !from) return { sent: false as const }

  const resend = new Resend(apiKey)
  await resend.emails.send({ from, to: params.to, subject: params.subject, html: params.html })
  return { sent: true as const }
}

export async function sendDriverApprovedEmail(to: string, accessToken: string) {
  const accessUrl = `${siteUrl()}/chauffeur/access?token=${encodeURIComponent(accessToken)}`

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2937;max-width:620px">
      <p style="font-size:12px;color:#6b7280">U kunt nu inloggen op het AlmereTaxiBoeken chauffeurportaal.</p>
      <h2 style="margin-bottom:10px">Uw profiel is goedgekeurd</h2>
      <p>Uw chauffeurprofiel is gecontroleerd en goedgekeurd. U kunt nu inloggen op het chauffeurportaal en uw toegewezen ritten bekijken.</p>
      <p style="margin:20px 0">
        <a href="${accessUrl}" style="display:inline-block;padding:10px 16px;border-radius:8px;background:#111827;color:#f9fafb;text-decoration:none;font-weight:600">Inloggen op chauffeurportaal</a>
      </p>
      <p style="font-size:12px;color:#6b7280">Deze link is persoonlijk en tijdelijk geldig. Deel deze link niet met anderen.</p>
      <p style="word-break:break-all;font-size:12px;color:#4b5563">${accessUrl}</p>
    </div>
  `

  return sendEmail({ to, subject: "Uw chauffeurprofiel is goedgekeurd", html })
}

export async function sendDriverLoginLinkEmail(to: string, accessToken: string) {
  const accessUrl = `${siteUrl()}/chauffeur/access?token=${encodeURIComponent(accessToken)}`
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2937;max-width:620px">
      <h2 style="margin-bottom:10px">Uw inloglink</h2>
      <p>Gebruik onderstaande beveiligde link om in te loggen op het chauffeurportaal.</p>
      <p style="margin:20px 0">
        <a href="${accessUrl}" style="display:inline-block;padding:10px 16px;border-radius:8px;background:#111827;color:#f9fafb;text-decoration:none;font-weight:600">Inloggen op chauffeurportaal</a>
      </p>
      <p style="font-size:12px;color:#6b7280">Deze link is persoonlijk en tijdelijk geldig. Deel deze link niet met anderen.</p>
      <p style="word-break:break-all;font-size:12px;color:#4b5563">${accessUrl}</p>
    </div>
  `

  return sendEmail({ to, subject: "Uw inloglink voor chauffeurportaal", html })
}
