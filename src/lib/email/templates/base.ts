export interface EmailDetailItem {
  label: string
  value: string
}

export interface BaseEmailInput {
  preheader: string
  label: string
  title: string
  intro: string
  details?: EmailDetailItem[]
  ctaLabel?: string
  ctaUrl?: string
  fallbackLinkLabel?: string
  fallbackLinkUrl?: string
  note?: string
}

function esc(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function wrapParagraphs(text: string) {
  return text
    .split("\n")
    .filter(Boolean)
    .map((line) => `<p style=\"margin:0 0 12px;color:#B7AEA2;font-size:15px;line-height:1.6;\">${esc(line)}</p>`)
    .join("")
}

function detailBlock(items: EmailDetailItem[]) {
  if (!items.length) return ""

  const rows = items
    .map(
      (item) => `
        <tr>
          <td style=\"padding:10px 12px;color:#7F776E;font-size:12px;line-height:1.4;width:38%;vertical-align:top;\">${esc(item.label)}</td>
          <td style=\"padding:10px 12px;color:#F5F1E8;font-size:14px;line-height:1.45;font-weight:600;word-break:break-word;\">${esc(item.value || "-")}</td>
        </tr>`,
    )
    .join("")

  return `
    <div style="margin:18px 0 0;background:#151311;border:1px solid #292520;border-radius:14px;overflow:hidden;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
        ${rows}
      </table>
    </div>
  `
}

export function renderBaseEmail(input: BaseEmailInput) {
  const now = new Date().getFullYear()
  const safeDetails = input.details ?? []
  const cta = input.ctaLabel && input.ctaUrl
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 0;"><tr><td style="border-radius:999px;background:#D6B58A;"><a href="${esc(input.ctaUrl)}" style="display:inline-block;padding:12px 20px;font-size:14px;line-height:1.2;font-weight:700;color:#080807;text-decoration:none;border-radius:999px;">${esc(input.ctaLabel)}</a></td></tr></table>`
    : ""

  const fallback = input.fallbackLinkUrl
    ? `
      <div style="margin:18px 0 0;padding:12px;border:1px solid #292520;border-radius:12px;background:#151311;">
        <p style="margin:0 0 6px;color:#7F776E;font-size:12px;">${esc(input.fallbackLinkLabel || "Kopieer deze link als de knop niet werkt")}</p>
        <p style="margin:0;color:#B7AEA2;font-size:12px;line-height:1.5;word-break:break-all;">${esc(input.fallbackLinkUrl)}</p>
      </div>
    `
    : ""

  const note = input.note
    ? `<p style="margin:16px 0 0;color:#7F776E;font-size:12px;line-height:1.5;">${esc(input.note)}</p>`
    : ""

  const html = `<!DOCTYPE html>
<html lang="nl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${esc(input.title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#080807;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;line-height:1px;">${esc(input.preheader)}</div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#080807;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;border-collapse:collapse;">
            <tr>
              <td style="padding:0 8px 14px;">
                <p style="margin:0;font-size:20px;line-height:1.1;font-weight:800;letter-spacing:-0.3px;"><span style="color:#F5F1E8;">AlmereTaxi</span><span style="color:#D6B58A;">Boeken</span></p>
                <p style="margin:8px 0 0;color:#7F776E;font-size:12px;line-height:1.4;">${esc(input.label)}</p>
              </td>
            </tr>
            <tr>
              <td style="background:#11100E;border:1px solid #292520;border-radius:20px;padding:28px 22px;">
                <h1 style="margin:0 0 14px;color:#F5F1E8;font-size:26px;line-height:1.2;font-weight:800;letter-spacing:-0.4px;">${esc(input.title)}</h1>
                ${wrapParagraphs(input.intro)}
                ${detailBlock(safeDetails)}
                ${cta}
                ${fallback}
                ${note}
              </td>
            </tr>
            <tr>
              <td style="padding:14px 8px 0;">
                <p style="margin:0;color:#7F776E;font-size:12px;line-height:1.5;">AlmereTaxiBoeken</p>
                <p style="margin:4px 0 0;color:#7F776E;font-size:12px;line-height:1.5;">Deze e-mail is automatisch verzonden door AlmereTaxiBoeken.</p>
                <p style="margin:4px 0 0;color:#7F776E;font-size:12px;line-height:1.5;">&copy; ${now} AlmereTaxiBoeken</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

  const textParts: string[] = [
    input.label,
    input.title,
    input.intro,
  ]

  if (safeDetails.length) {
    textParts.push("", "Details:")
    for (const item of safeDetails) {
      textParts.push(`- ${item.label}: ${item.value || "-"}`)
    }
  }

  if (input.ctaLabel && input.ctaUrl) {
    textParts.push("", `${input.ctaLabel}: ${input.ctaUrl}`)
  }

  if (input.note) {
    textParts.push("", input.note)
  }

  textParts.push("", "Deze e-mail is automatisch verzonden door AlmereTaxiBoeken.")

  return {
    html,
    text: textParts.join("\n"),
  }
}

