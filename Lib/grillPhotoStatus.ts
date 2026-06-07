export type GrillPhotoStatus = 'received' | 'pending' | 'not_applicable'

export type GrillPhotoStatusInput = {
  hasGrill?: boolean | null
  grillPhotoRequired?: boolean | null
  grillPhotoUrl?: string | null
  grillPhotoMediaId?: string | null
}

export function deriveGrillPhotoStatus(
  input: GrillPhotoStatusInput,
): GrillPhotoStatus {
  if (input.hasGrill === false) return 'not_applicable'
  if (input.hasGrill !== true) return 'not_applicable'

  if (input.grillPhotoUrl?.trim() || input.grillPhotoMediaId?.trim()) {
    return 'received'
  }

  if (input.grillPhotoRequired) return 'pending'
  return 'received'
}

export function grillPhotoStatusToRequired(status: GrillPhotoStatus): boolean {
  return status === 'pending'
}

export function getGrillPhotoStatusLabel(status: GrillPhotoStatus): string {
  switch (status) {
    case 'received':
      return 'Sim'
    case 'pending':
      return 'Pendente'
    case 'not_applicable':
      return 'Não se aplica'
    default:
      return '—'
  }
}

/** Rótulo para detalhe/PDF da cotação */
export function getGrillPhotoDetailLabel(
  input: GrillPhotoStatusInput,
): string {
  const status = deriveGrillPhotoStatus(input)
  switch (status) {
    case 'received':
      return 'Confirmada'
    case 'pending':
      return 'Pendente'
    case 'not_applicable':
      return 'Não se aplica'
    default:
      return '—'
  }
}

export function getGrillPhotoBadgeLabel(status: GrillPhotoStatus): string {
  switch (status) {
    case 'received':
      return 'Recebida'
    case 'pending':
      return 'Pendente'
    case 'not_applicable':
      return 'Não aplica'
    default:
      return '—'
  }
}
