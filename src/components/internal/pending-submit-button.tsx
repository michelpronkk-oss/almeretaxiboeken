"use client"

import { useFormStatus } from "react-dom"

export default function PendingSubmitButton({
  idleLabel,
  pendingLabel,
  className,
}: {
  idleLabel: string
  pendingLabel: string
  className: string
}) {
  const { pending } = useFormStatus()

  return (
    <button type="submit" disabled={pending} className={`${className} disabled:cursor-not-allowed disabled:opacity-50`}>
      {pending ? pendingLabel : idleLabel}
    </button>
  )
}
