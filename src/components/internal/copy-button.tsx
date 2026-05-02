"use client"

import { useState } from "react"

export default function CopyButton({ value, label = "Kopieren" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className="rounded-md border border-[#3A2D1F] px-2 py-1 text-[11px] font-semibold text-[#D6B58A] hover:bg-[#1B1815]"
    >
      {copied ? "Gekopieerd" : label}
    </button>
  )
}
