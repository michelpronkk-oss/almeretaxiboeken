import "server-only"
import { Resend } from "resend"

interface InviteEmailParams {
  to: string
  onboardingUrl: string
}

export async function sendDriverInviteEmail({ to, onboardingUrl }: InviteEmailParams) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL

  if (!apiKey || !from) {
    return { sent: false as const }
  }

  const resend = new Resend(apiKey)

  await resend.emails.send({
    from,
    to,
    subject: "Uitnodiging voor AlmereTaxiBoeken chauffeurportaal",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2937;max-width:620px">
        <h2 style="margin-bottom:10px">Uitnodiging chauffeurportaal</h2>
        <p>U bent uitgenodigd om uw chauffeurprofiel aan te maken voor AlmereTaxiBoeken. Vul uw gegevens en documenten aan via onderstaande beveiligde link.</p>
        <p style="margin:20px 0">
          <a href="${onboardingUrl}" style="display:inline-block;padding:10px 16px;border-radius:8px;background:#111827;color:#f9fafb;text-decoration:none;font-weight:600">Profiel aanmaken</a>
        </p>
        <p>Of open deze link direct:<br /><a href="${onboardingUrl}">${onboardingUrl}</a></p>
      </div>
    `,
  })

  return { sent: true as const }
}
