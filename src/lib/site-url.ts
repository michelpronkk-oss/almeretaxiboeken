const CANONICAL_HOST = "www.almeretaxiboeken.nl"

export function canonicalizePublicUrl(value: string) {
  try {
    const url = new URL(value)
    if (url.hostname === "almeretaxiboeken.nl") {
      url.hostname = CANONICAL_HOST
    }
    return url.toString().replace(/\/$/, "")
  } catch {
    return value.replace(/\/$/, "")
  }
}

export function getPublicSiteUrl() {
  return canonicalizePublicUrl(process.env.NEXT_PUBLIC_SITE_URL || `https://${CANONICAL_HOST}`)
}

export function getMollieRedirectUrl() {
  return canonicalizePublicUrl(process.env.MOLLIE_REDIRECT_URL || `${getPublicSiteUrl()}/boeking/bedankt`)
}

export function getMollieWebhookUrl() {
  return canonicalizePublicUrl(process.env.MOLLIE_WEBHOOK_URL || `${getPublicSiteUrl()}/api/mollie/webhook`)
}
