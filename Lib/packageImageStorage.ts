import { supabase } from './supabase'

export const PACKAGE_IMAGES_BUCKET = 'package-images'

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
])

export function isAllowedPackageImageType(type: string) {
  return ALLOWED_TYPES.has(type.toLowerCase())
}

export async function uploadPackageImage(
  packageId: string,
  file: File,
): Promise<{ publicUrl: string | null; error: string | null }> {
  if (!isAllowedPackageImageType(file.type)) {
    return {
      publicUrl: null,
      error: 'Formato inválido. Use JPEG, PNG ou WebP.',
    }
  }

  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const objectPath = `${packageId}/${Date.now()}.${extension}`

  const { error: uploadError } = await supabase.storage
    .from(PACKAGE_IMAGES_BUCKET)
    .upload(objectPath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type,
    })

  if (uploadError) {
    return { publicUrl: null, error: uploadError.message }
  }

  const { data } = supabase.storage
    .from(PACKAGE_IMAGES_BUCKET)
    .getPublicUrl(objectPath)

  const publicUrl = data.publicUrl?.trim() || null
  if (!publicUrl) {
    return { publicUrl: null, error: 'URL pública da imagem não gerada.' }
  }

  const { error: updateError } = await supabase
    .from('packages')
    .update({ image_url: publicUrl })
    .eq('id', packageId)

  if (updateError) {
    return { publicUrl: null, error: updateError.message }
  }

  return { publicUrl, error: null }
}
