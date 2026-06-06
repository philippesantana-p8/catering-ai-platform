'use client'

import { useEffect, useRef, useState } from 'react'
import { parseGooglePlace, type AddressValues } from './googlePlaces'

type FieldCompletion = 'filled' | 'empty'

function getInputClassName(completion?: FieldCompletion) {
  const base =
    'w-full rounded-xl border px-4 py-3.5 pr-10 text-base text-cdl-fg shadow-cdl outline-none transition-colors placeholder:text-cdl-faint focus:border-cdl-accent-border'
  if (completion === 'filled') return `${base} cdl-field-filled`
  if (completion === 'empty') return `${base} cdl-field-empty`
  return `${base} border-cdl-border bg-cdl-inset`
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="cdl-eyebrow">{children}</span>
}

function FieldCheck({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <span
      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-cdl-success"
      aria-hidden
    >
      ✓
    </span>
  )
}

function useGooglePlacesReady() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  useEffect(() => {
    if (!apiKey) {
      setError('Configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY para buscar no Google.')
      return
    }

    if (window.google?.maps?.places) {
      setReady(true)
      return
    }

    const scriptId = 'google-maps-places-script'
    const existingScript = document.getElementById(scriptId) as
      | HTMLScriptElement
      | null

    function handleReady() {
      setReady(true)
      setError(null)
    }

    if (existingScript) {
      existingScript.addEventListener('load', handleReady)
      return () => existingScript.removeEventListener('load', handleReady)
    }

    const script = document.createElement('script')
    script.id = scriptId
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = handleReady
    script.onerror = () =>
      setError('Não foi possível carregar o Google Places.')
    document.head.appendChild(script)
  }, [apiKey])

  return { ready, error, enabled: Boolean(apiKey) }
}

export default function AddressAutocompleteFields({
  values,
  onChange,
  className = '',
  fieldCompletions,
}: {
  values: AddressValues
  onChange: (patch: Partial<AddressValues>) => void
  className?: string
  fieldCompletions?: {
    city?: FieldCompletion
    state?: FieldCompletion
    zipCode?: FieldCompletion
  }
}) {
  const searchInputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const onChangeRef = useRef(onChange)
  const { ready, error, enabled } = useGooglePlacesReady()

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (!ready || !searchInputRef.current || autocompleteRef.current) return

    const autocomplete = new google.maps.places.Autocomplete(
      searchInputRef.current,
      {
        types: ['address'],
        componentRestrictions: { country: 'us' },
        fields: ['address_components', 'formatted_address'],
      },
    )

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      const parsed = parseGooglePlace(place)
      onChangeRef.current(parsed)
      if (searchInputRef.current) {
        searchInputRef.current.value = ''
      }
    })

    autocompleteRef.current = autocomplete
  }, [ready])

  return (
    <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${className}`}>
      {enabled && (
        <div className="flex flex-col gap-2 sm:col-span-2">
          <FieldLabel>Buscar endereço no Google</FieldLabel>
          <input
            ref={searchInputRef}
            type="text"
            disabled={!ready}
            placeholder={
              ready
                ? 'Digite o endereço para autocompletar...'
                : 'Carregando Google Places...'
            }
            className={getInputClassName()}
          />
          {error && <p className="text-xs text-cdl-muted">{error}</p>}
        </div>
      )}

      <div className="flex flex-col gap-2 sm:col-span-2">
        <FieldLabel>Address</FieldLabel>
        <input
          type="text"
          value={values.address}
          onChange={(e) => onChange({ address: e.target.value })}
          placeholder="Endereço"
          className={getInputClassName()}
        />
      </div>

      <label className="flex flex-col gap-2">
        <FieldLabel>City</FieldLabel>
        <div className="relative">
          <input
            type="text"
            value={values.city}
            onChange={(e) => onChange({ city: e.target.value })}
            placeholder="Cidade"
            className={getInputClassName(fieldCompletions?.city)}
          />
          <FieldCheck show={fieldCompletions?.city === 'filled'} />
        </div>
      </label>

      <label className="flex flex-col gap-2">
        <FieldLabel>State</FieldLabel>
        <div className="relative">
          <input
            type="text"
            value={values.state}
            onChange={(e) => onChange({ state: e.target.value })}
            placeholder="Estado"
            className={getInputClassName(fieldCompletions?.state)}
          />
          <FieldCheck show={fieldCompletions?.state === 'filled'} />
        </div>
      </label>

      <label className="flex flex-col gap-2">
        <FieldLabel>Zip Code</FieldLabel>
        <div className="relative">
          <input
            type="text"
            value={values.zipCode}
            onChange={(e) => onChange({ zipCode: e.target.value })}
            placeholder="CEP / ZIP"
            className={getInputClassName(fieldCompletions?.zipCode)}
          />
          <FieldCheck show={fieldCompletions?.zipCode === 'filled'} />
        </div>
      </label>
    </div>
  )
}
