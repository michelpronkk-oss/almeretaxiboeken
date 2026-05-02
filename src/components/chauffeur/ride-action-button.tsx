"use client"

import { useFormStatus } from "react-dom"
import { Loader2 } from "lucide-react"

function SubmitBtn({
  label,
  variant,
}: {
  label: string
  variant: "primary" | "ghost"
}) {
  const { pending } = useFormStatus()

  const base =
    "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"

  const styles = {
    primary:
      "border border-[#D6B58A]/40 bg-[#D6B58A]/[0.08] text-[#D6B58A] hover:bg-[#D6B58A]/[0.16]",
    ghost:
      "border border-[#292520] bg-transparent text-[#B7AEA2] hover:bg-[#141210]",
  }

  return (
    <button type="submit" disabled={pending} className={`${base} ${styles[variant]}`}>
      {pending ? (
        <>
          <Loader2 className="size-3.5 animate-spin" />
          Even geduld…
        </>
      ) : (
        label
      )}
    </button>
  )
}

export function RideActionButton({
  action,
  bookingId,
  nextStatus,
  label,
  variant = "primary",
}: {
  action: (formData: FormData) => Promise<void>
  bookingId: string
  nextStatus: string
  label: string
  variant?: "primary" | "ghost"
}) {
  return (
    <form action={action} className="w-full">
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="nextStatus" value={nextStatus} />
      <SubmitBtn label={label} variant={variant} />
    </form>
  )
}
