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

  useEffect(() => {
    onChangeRef.current = onChange
    onPlaceSelectRef.current = onPlaceSelect
  }, [onChange, onPlaceSelect])

  const initAutocomplete = useCallback(() => {
    if (autocompleteRef.current) return
    if (typeof google === "undefined" || !google.maps?.places) {
      setAutocompleteUnavailable(true)
      return
    }
    if (!inputRef.current) return

    const ac = new google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: "nl" },
      fields: ["formatted_address", "name", "place_id"],
    })

    ac.addListener("place_changed", () => {
      const place = ac.getPlace()
      const selectedAddress = (place.formatted_address || place.name || inputRef.current?.value || "").trim()
      onChangeRef.current(selectedAddress)
      onPlaceSelectRef.current?.({
        address: selectedAddress,
        placeId: place.place_id || undefined,
      })
    })

    autocompleteRef.current = ac
    setAutocompleteUnavailable(false)
  }, [])

  useEffect(() => {
    let retries = 0
    const tryInit = () => {
      if (disabled) return
      if (typeof google !== "undefined" && google.maps?.places) {
        initAutocomplete()
        return
      }
      if (retries++ < 25) {
        window.setTimeout(tryInit, 300)
      } else {
        setAutocompleteUnavailable(true)
      }
    }

    tryInit()
  }, [disabled, initAutocomplete])

  return (
    <div className={wrapperClassName}>
      {label ? <label htmlFor={inputId} className="mb-1.5 block text-xs text-[#B7AEA2]">{label}</label> : null}
      <input
        id={inputId}
        ref={inputRef}
        name={name}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          if (onPlaceSelect) {
            onPlaceSelect({ address: e.target.value, placeId: undefined })
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        className={inputClassName}
      />
      {autocompleteUnavailable ? (
        <p className="mt-1.5 text-[11px] text-[#8F877D]">Adres automatisch aanvullen is niet beschikbaar.</p>
      ) : null}
    </div>
  )
}
