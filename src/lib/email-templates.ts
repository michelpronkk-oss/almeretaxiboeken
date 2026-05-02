function nl(dateStr: string): string {
  const [y, m, d] = dateStr.split("-")
  const maanden = ["jan","feb","mrt","apr","mei","jun","jul","aug","sep","okt","nov","dec"]
  return `${d} ${maanden[parseInt(m, 10) - 1]} ${y}`
}

interface BookingData {
  bookingRef: string
  name: string
  phone: string
  email: string
  origin: string
  destination: string
  date: string
  time: string
  voertuig: string
  price: number
}

const base = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
  background: #f4f4f5;
  margin: 0;
  padding: 24px 16px;
`

export function customerEmailHtml(d: BookingData): string {
  return `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="${base}">
  <div style="max-width:580px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <div style="background:#0a0a0a;padding:24px 32px;display:flex;align-items:center;gap:8px;">
      <span style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">AlmereTaxi</span>
      <span style="font-size:18px;font-weight:700;color:#D4B896;letter-spacing:-0.3px;">Boeken</span>
    </div>
    <div style="padding:32px;">
      <h2 style="color:#0a0a0a;margin:0 0 8px;font-size:22px;font-weight:700;">Boeking bevestigd</h2>
      <p style="color:#52525b;margin:0 0 24px;font-size:15px;">Beste ${d.name}, uw betaling is ontvangen en uw rit is bevestigd.</p>

      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
        <tr style="background:#f9f9fb;">
          <td style="padding:10px 14px;color:#71717a;width:38%;border-radius:4px 0 0 4px;">Referentie</td>
          <td style="padding:10px 14px;font-weight:600;color:#0a0a0a;letter-spacing:0.5px;">${d.bookingRef}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;color:#71717a;">Van</td>
          <td style="padding:10px 14px;">${d.origin}</td>
        </tr>
        <tr style="background:#f9f9fb;">
          <td style="padding:10px 14px;color:#71717a;">Naar</td>
          <td style="padding:10px 14px;">${d.destination}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;color:#71717a;">Datum &amp; tijd</td>
          <td style="padding:10px 14px;">${nl(d.date)} om ${d.time}</td>
        </tr>
        <tr style="background:#f9f9fb;">
          <td style="padding:10px 14px;color:#71717a;">Voertuig</td>
          <td style="padding:10px 14px;">${d.voertuig}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;color:#71717a;font-weight:600;">Vaste prijs</td>
          <td style="padding:10px 14px;font-weight:700;font-size:16px;color:#0a0a0a;">€ ${d.price.toFixed(2).replace(".", ",")}</td>
        </tr>
      </table>

      <div style="background:#fafaf5;border:1px solid #e8e2d8;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="margin:0;font-size:13px;color:#71717a;">Bij vragen kunt u ons bereiken via <a href="mailto:info@almeretaxiboeken.nl" style="color:#c4a97a;">info@almeretaxiboeken.nl</a> of bel <a href="tel:+31361234567" style="color:#c4a97a;">036 123 45 67</a>.</p>
      </div>
    </div>
    <div style="background:#0a0a0a;padding:16px 32px;text-align:center;">
      <p style="color:#52525b;font-size:12px;margin:0;">© 2026 AlmereTaxiBoeken · Almere</p>
    </div>
  </div>
</body>
</html>`
}

export function companyEmailHtml(d: BookingData): string {
  return `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"></head>
<body style="${base}">
  <div style="max-width:580px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">
    <div style="background:#0a0a0a;padding:20px 32px;">
      <span style="font-size:14px;font-weight:600;color:#D4B896;">🚕 Nieuwe boeking — ${d.bookingRef}</span>
    </div>
    <div style="padding:28px 32px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr style="background:#f9f9fb;"><td style="padding:9px 12px;color:#71717a;width:38%;">Referentie</td><td style="padding:9px 12px;font-weight:600;">${d.bookingRef}</td></tr>
        <tr><td style="padding:9px 12px;color:#71717a;">Klant</td><td style="padding:9px 12px;">${d.name}</td></tr>
        <tr style="background:#f9f9fb;"><td style="padding:9px 12px;color:#71717a;">Telefoon</td><td style="padding:9px 12px;"><a href="tel:${d.phone}" style="color:#c4a97a;">${d.phone}</a></td></tr>
        <tr><td style="padding:9px 12px;color:#71717a;">E-mail</td><td style="padding:9px 12px;"><a href="mailto:${d.email}" style="color:#c4a97a;">${d.email}</a></td></tr>
        <tr style="background:#f9f9fb;"><td style="padding:9px 12px;color:#71717a;">Van</td><td style="padding:9px 12px;">${d.origin}</td></tr>
        <tr><td style="padding:9px 12px;color:#71717a;">Naar</td><td style="padding:9px 12px;">${d.destination}</td></tr>
        <tr style="background:#f9f9fb;"><td style="padding:9px 12px;color:#71717a;">Datum &amp; tijd</td><td style="padding:9px 12px;">${nl(d.date)} om ${d.time}</td></tr>
        <tr><td style="padding:9px 12px;color:#71717a;">Voertuig</td><td style="padding:9px 12px;">${d.voertuig}</td></tr>
        <tr style="background:#f9f9fb;"><td style="padding:9px 12px;color:#71717a;font-weight:600;">Prijs</td><td style="padding:9px 12px;font-weight:700;">€ ${d.price.toFixed(2).replace(".", ",")}</td></tr>
      </table>
    </div>
  </div>
</body>
</html>`
}
