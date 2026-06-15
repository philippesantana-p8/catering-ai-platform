import { getCdlCompanyId } from './cdlCompany'
import {
  buildCatalogItemsListSelect,
  CATALOG_ITEMS_TABLE,
  type CatalogItemsTableColumn,
} from './catalogItemsTableSchema'
import type { CatalogItemListItem } from './fetchCatalogItems'
import { getSupabaseServerClient } from './supabaseServer'

export const ADDITIONAL_ITEM_IMAGES_BUCKET = 'additional-item-images'

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
])

export type AdditionalItemImageRow = {
  id: string
  item_key?: string | null
  company_id?: string | null
}

export type UploadCatalogItemImageResult = {
  publicUrl: string | null
  item: CatalogItemListItem | null
  error: string | null
}

/** @deprecated Use UploadCatalogItemImageResult */
export type UploadAdditionalItemImageResult = UploadCatalogItemImageResult

export function isAllowedAdditionalItemImageType(type: string) {
  return ALLOWED_TYPES.has(type.toLowerCase())
}

function sanitizeStorageSegment(value: string): string {
  const cleaned = value.trim().replace(/[^a-zA-Z0-9_-]/g, '_')
  return cleaned || 'item'
}

function extensionFromFile(file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase()
  if (fromName && ['jpg', 'jpeg', 'png', 'webp'].includes(fromName)) {
    return fromName === 'jpeg' ? 'jpg' : fromName
  }
  if (file.type === 'image/jpeg') return 'jpg'
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  return 'jpg'
}

export async function uploadAdditionalItemImage(
  itemId: string,
  file: File,
): Promise<UploadAdditionalItemImageResult> {
  if (!isAllowedAdditionalItemImageType(file.type)) {
    return {
      publicUrl: null,
      item: null,
      error: 'Formato inválido. Use PNG, JPG, JPEG ou WebP.',
    }
  }

  const normalizedId = itemId?.trim()
  if (!normalizedId) {
    return { publicUrl: null, item: null, error: 'ID do item do catálogo é obrigatório.' }
  }

  const supabase = getSupabaseServerClient()

  const { data: row, error: fetchError } = await supabase
    .from(CATALOG_ITEMS_TABLE)
    .select('id, item_key, company_id')
    .eq('id', normalizedId)
    .maybeSingle()

  if (fetchError) {
    return {
      publicUrl: null,
      item: null,
      error: `Falha ao buscar item do catálogo: ${fetchError.message}`,
    }
  }

  if (!row?.id) {
    return {
      publicUrl: null,
      item: null,
      error: 'Item do catálogo não encontrado.',
    }
  }

  const item = row as AdditionalItemImageRow
  const companyId =
    item.company_id?.trim() || getCdlCompanyId()?.trim() || 'company'
  const keySegment = sanitizeStorageSegment(item.item_key ?? item.id)
  const extension = extensionFromFile(file)
  const objectPath = `${companyId}/${keySegment}_${Date.now()}.${extension}`

  const fileBuffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from(ADDITIONAL_ITEM_IMAGES_BUCKET)
    .upload(objectPath, fileBuffer, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || `image/${extension === 'jpg' ? 'jpeg' : extension}`,
    })

  if (uploadError) {
    const message = uploadError.message ?? 'Falha no upload para o storage.'
    if (/bucket|not found|does not exist/i.test(message)) {
      return {
        publicUrl: null,
        item: null,
        error: `Bucket "${ADDITIONAL_ITEM_IMAGES_BUCKET}" indisponível: ${message}`,
      }
    }
    if (/policy|permission|denied|rls/i.test(message)) {
      return {
        publicUrl: null,
        item: null,
        error: `Permissão negada no storage (RLS): ${message}`,
      }
    }
    return { publicUrl: null, item: null, error: message }
  }

  const { data: urlData } = supabase.storage
    .from(ADDITIONAL_ITEM_IMAGES_BUCKET)
    .getPublicUrl(objectPath)

  const publicUrl = urlData.publicUrl?.trim() || null
  if (!publicUrl) {
    return {
      publicUrl: null,
      item: null,
      error: 'URL pública da imagem não gerada.',
    }
  }

  const now = new Date().toISOString()
  const updatePayload: Partial<
    Record<CatalogItemsTableColumn, string | null>
  > = {
    image_url: publicUrl,
    image_status: 'ready',
    image_notes: 'Imagem atualizada pelo cadastro de itens.',
    updated_at: now,
  }

  const { data: updated, error: updateError } = await supabase
    .from(CATALOG_ITEMS_TABLE)
    .update(updatePayload)
    .eq('id', normalizedId)
    .select(buildCatalogItemsListSelect())
    .single()

  if (updateError) {
    const message = updateError.message ?? 'Falha ao atualizar catalog_items.'
    if (/column|schema|image_status|image_notes/i.test(message)) {
      return {
        publicUrl: null,
        item: null,
        error: `Coluna inválida ao salvar imagem: ${message}`,
      }
    }
    if (/policy|permission|denied|rls/i.test(message)) {
      return {
        publicUrl: null,
        item: null,
        error: `Permissão negada ao atualizar item (RLS): ${message}`,
      }
    }
    return { publicUrl: null, item: null, error: message }
  }

  return {
    publicUrl,
    item: (updated as unknown as CatalogItemListItem | null) ?? null,
    error: null,
  }
}
