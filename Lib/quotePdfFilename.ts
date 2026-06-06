export function getQuotePdfFilename(quoteNumber: string | null | undefined) {
  const safe = (quoteNumber ?? 'CDL-Q-0000').trim().replace(/\s+/g, '-')
  return `${safe}-BBQ-At-Home-Quote.pdf`
}
