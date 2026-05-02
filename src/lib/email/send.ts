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
    return { sent: false as const, reason: "missing_config" as const, id: "" }
  }

  try {
    const resend = new Resend(apiKey)
    const result = await resend.emails.send({
      from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    })

    const resultId =
      typeof result === "object" && result && "data" in result && result.data && typeof result.data === "object" && "id" in result.data
        ? String(result.data.id || "")
        : ""

    const resultError =
      typeof result === "object" && result && "error" in result && result.error
        ? String((result.error as { message?: string }).message || "Resend returned error")
        : ""

    if (resultError) {
      return { sent: false as const, reason: "provider_error" as const, error: resultError, id: resultId }
    }

    return { sent: true as const, id: resultId }
  } catch (error) {
    return {
      sent: false as const,
      reason: "send_failed" as const,
      error: error instanceof Error ? error.message : "Unknown send error",
      id: "",
    }
  }
}
