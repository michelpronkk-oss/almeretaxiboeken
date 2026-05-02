type SearchParams = Promise<{ payment_id?: string; id?: string; booking_ref?: string }>

interface MolliePayment {
  status?: string
}

async function getPaymentStatus(paymentId: string): Promise<string | null> {
  const mollieApiKey = process.env.MOLLIE_API_KEY
  if (!mollieApiKey) return null

  const res = await fetch(`https://api.mollie.com/v2/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${mollieApiKey}` },
    cache: "no-store",
  })
  if (!res.ok) return null
  const payment = (await res.json()) as MolliePayment
  return payment.status ?? null
}

export default async function BookingThanksPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const paymentId = params.payment_id?.trim() || params.id?.trim() || ""
  const bookingRef = params.booking_ref?.trim() || ""
  const status = paymentId ? await getPaymentStatus(paymentId) : null
  const isPaid = status === "paid"

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-6 py-24 text-white">
      <div className="mx-auto max-w-xl rounded-2xl border border-white/[0.09] bg-[#111111] p-6 shadow-2xl">
        <h1 className="text-2xl font-semibold text-white">
          {isPaid ? "Boeking bevestigd" : "Betaling in behandeling"}
        </h1>

        {bookingRef ? (
          <p className="mt-2 text-sm text-white/50">
            Referentie: <span className="font-mono text-[#D4B896]">{bookingRef}</span>
          </p>
        ) : null}

        {isPaid ? (
          <div className="mt-4 space-y-2 text-sm text-white/70">
            <p>Uw betaling is ontvangen en uw rit is bevestigd.</p>
            <p>U ontvangt de bevestiging per e-mail.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-2 text-sm text-white/70">
            <p>
              We controleren uw betaling. Vernieuw deze pagina over enkele seconden of neem
              contact op via WhatsApp.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
