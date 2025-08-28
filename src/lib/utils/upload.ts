import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { NextRequest } from 'next/server'

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

export async function uploadProfileImage(request: NextRequest): Promise<UploadResult> {
  try {
    const formData = await request.formData()
    const file = formData.get('avatar') as File

    if (!file) {
      return { success: false, error: "No file provided" }
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: "Invalid file type. Only JPEG, PNG, and WebP are allowed" }
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return { success: false, error: "File too large. Maximum size is 5MB" }
    }

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2)
    const extension = path.extname(file.name)
    const filename = `avatar_${timestamp}_${randomString}${extension}`

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const filepath = path.join(uploadDir, filename)
    await writeFile(filepath, buffer)

    // Return public URL
    const publicUrl = `/uploads/avatars/${filename}`
    
    return { success: true, url: publicUrl }

  } catch (error) {
    console.error('Upload error:', error)
    return { success: false, error: "Failed to upload file" }
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