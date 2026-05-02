"use client"

import { useCallback, useEffect, useId, useRef, useState } from "react"

export interface AddressAutocompletePlace {
  address: string
  placeId?: string
}

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onPlaceSelect?: (place: AddressAutocompletePlace) => void
  placeholder?: string
  label?: string
  disabled?: boolean
  inputClassName?: string
  wrapperClassName?: string
  name?: string
}

// ── Module-level singleton — shared across all instances on the page ───────────

let mapsPromise: Promise<void> | null = null

function loadGoogleMaps(): Promise<void> {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY?.trim()
  if (!key) return Promise.reject(new Error("No Maps key configured"))

  // Already available
  if (typeof google !== "undefined" && google.maps?.places) {
    return Promise.resolve()
  }

  // Already loading — return the same promise
  if (mapsPromise) return mapsPromise

  mapsPromise = new Promise<void>((resolve, reject) => {
    // Script already injected (e.g. second render) — just poll
    if (document.querySelector("[data-atb-maps]")) {
      let n = 0
      const poll = () => {
        if (typeof google !== "undefined" && google.maps?.places) {
          resolve()
          return
        }
        if (n++ < 80) setTimeout(poll, 150)
        else reject(new Error("Maps load timeout"))
      }
      poll()
      return
    }

    // Define the callback Maps will call when ready
    const cb = "__atb_maps_ready"
    ;(window as unknown as Record<string, unknown>)[cb] = () => {
      delete (window as unknown as Record<string, unknown>)[cb]
      resolve()
    }

    const s = document.createElement("script")
    s.setAttribute("data-atb-maps", "1")
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&callback=${cb}&loading=async`
    s.async = true
    s.defer = true
    s.onerror = () => {
      mapsPromise = null
      reject(new Error("Maps script failed to load"))
    }
    document.head.appendChild(s)
  })

  return mapsPromise
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AddressAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder,
  label,
  disabled,
  inputClassName,
  wrapperClassName,
  name,
}: AddressAutocompleteProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const onChangeRef = useRef(onChange)
  const onPlaceSelectRef = useRef(onPlaceSelect)
  const [autocompleteUnavailable, setAutocompleteUnavailable] = useState(false)

  // Keep callbacks fresh without re-running effects
  useEffect(() => {
    onChangeRef.current = onChange
    onPlaceSelectRef.current = onPlaceSelect
  }, [onChange, onPlaceSelect])

  const initAutocomplete = useCallback(() => {
    if (autocompleteRef.current) return
    if (typeof google === "undefined" || !google.maps?.places) return
    if (!inputRef.current) return

    const ac = new google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: "nl" },
      fields: ["formatted_address", "name", "place_id"],
    })

    ac.addListener("place_changed", () => {
      const place = ac.getPlace()
      const addr = (
        place.formatted_address ||
        place.name ||
        inputRef.current?.value ||
        ""
      ).trim()
      onChangeRef.current(addr)
      onPlaceSelectRef.current?.({ address: addr, placeId: place.place_id ?? undefined })
    })

    autocompleteRef.current = ac
    setAutocompleteUnavailable(false)
  }, [])

  // If Maps was already loaded before this component mounted (e.g. warm navigation)
  useEffect(() => {
    if (disabled) return
    if (typeof google !== "undefined" && google.maps?.places) {
      initAutocomplete()
    }
  }, [disabled, initAutocomplete])

  // Lazy-load Maps on first focus — the key performance optimisation
  const handleFocus = useCallback(async () => {
    if (disabled || autocompleteRef.current) return
    try {
      await loadGoogleMaps()
      initAutocomplete()
    } catch {
      setAutocompleteUnavailable(true)
    }
  }, [disabled, initAutocomplete])

  return (
    <div className={wrapperClassName}>
      {label ? (
        <label htmlFor={inputId} className="mb-1.5 block text-xs text-[#B7AEA2]">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        ref={inputRef}
        name={name}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          if (onPlaceSelect) onPlaceSelect({ address: e.target.value, placeId: undefined })
        }}
        onFocus={handleFocus}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        className={inputClassName}
      />
      {autocompleteUnavailable && (
        <p className="mt-1.5 text-[11px] text-[#8F877D]">
          Adres automatisch aanvullen is niet beschikbaar.
        </p>
      )}
    </div>
  )
}
