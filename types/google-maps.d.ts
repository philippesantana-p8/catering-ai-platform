declare namespace google.maps {
  interface GeocoderAddressComponent {
    long_name: string
    short_name: string
    types: string[]
  }

  namespace places {
    interface AutocompleteOptions {
      types?: string[]
      componentRestrictions?: { country: string | string[] }
      fields?: string[]
    }

    interface PlaceResult {
      address_components?: GeocoderAddressComponent[]
      formatted_address?: string
    }

    class Autocomplete {
      constructor(
        inputField: HTMLInputElement,
        opts?: AutocompleteOptions,
      )
      addListener(eventName: string, handler: () => void): void
      getPlace(): PlaceResult
    }
  }
}

interface Window {
  google?: typeof google
}
