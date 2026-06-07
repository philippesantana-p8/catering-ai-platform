/** Digits only — removes spaces, parentheses, dashes and plus signs. */
export function normalizePhone(value: string | null | undefined): string {
  if (!value) return ''
  return value.replace(/[^\d]/g, '')
}

export function isUsablePhone(value: string | null | undefined): boolean {
  return normalizePhone(value).length >= 10
}
