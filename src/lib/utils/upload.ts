import sharp from 'sharp'
import path from 'path'
import { NextRequest } from 'next/server'

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

// Small, re-encoded avatars live in PostgreSQL as data URLs. No local disk or
// separate paid object storage is required by the portfolio deployment.
export async function uploadProfileImage(request: NextRequest): Promise<UploadResult> {
  try {
    const formData = await request.formData()
    const file = formData.get('avatar')
    if (!(file instanceof File) || !isValidImageType(file.type)) {
      return { success: false, error: 'Choose a JPEG, PNG, or WebP image' }
    }
    if (file.size > 2 * 1024 * 1024) {
      return { success: false, error: 'Maximum image size is 2MB' }
    }
    const image = await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 16000000 })
      .rotate().resize(256, 256, { fit: 'cover' }).webp({ quality: 75 }).toBuffer()
    if (image.length > 50000) return { success: false, error: 'Image is too complex; choose a simpler image' }
    return { success: true, url: `data:image/webp;base64,${image.toString('base64')}` }
  } catch {
    return { success: false, error: 'Unable to read this image' }
  }
}

export function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase()
}

export function isValidImageType(mimetype: string): boolean {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  return allowedTypes.includes(mimetype)
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}