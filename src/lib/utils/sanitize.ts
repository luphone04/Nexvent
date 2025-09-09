/**
 * Input sanitization utilities for security
 */

// Remove HTML tags and potentially dangerous characters
export function sanitizeHtml(input: string): string {
  if (!input) return ''
  
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
}

// Sanitize text input (names, titles, etc.)
export function sanitizeText(input: string): string {
  if (!input) return ''
  
  return input
    .replace(/[<>\"'&]/g, '') // Remove potentially dangerous characters
    .trim()
    .substring(0, 1000) // Limit length
}

// Sanitize email input
export function sanitizeEmail(input: string): string {
  if (!input) return ''
  
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9@._-]/g, '') // Only allow valid email characters
}

// Sanitize search queries
export function sanitizeSearchQuery(input: string): string {
  if (!input) return ''
  
  return input
    .replace(/[<>\"'&;()]/g, '') // Remove dangerous characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .substring(0, 200) // Limit search query length
}

// Sanitize file names
export function sanitizeFileName(input: string): string {
  if (!input) return ''
  
  return input
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid characters with underscore
    .replace(/_{2,}/g, '_') // Remove consecutive underscores
    .substring(0, 255) // Limit filename length
}

// Sanitize URL inputs
export function sanitizeUrl(input: string): string {
  if (!input) return ''
  
  try {
    const url = new URL(input)
    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      return ''
    }
    return url.toString()
  } catch {
    return ''
  }
}

// Sanitize phone numbers (keep only digits and common formatting)
export function sanitizePhoneNumber(input: string): string {
  if (!input) return ''
  
  return input
    .replace(/[^0-9+\-\s()]/g, '') // Keep only valid phone characters
    .trim()
    .substring(0, 20) // Reasonable phone number length
}

// General object sanitizer
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  sanitizers: Partial<Record<keyof T, (value: unknown) => unknown>>
): T {
  const sanitized = { ...obj } as T
  
  for (const [key, sanitizer] of Object.entries(sanitizers) as [keyof T, (value: unknown) => unknown][]) {
    if (sanitized[key] !== undefined && sanitizer) {
      sanitized[key] = sanitizer(sanitized[key]) as T[keyof T]
    }
  }
  
  return sanitized
}

// Common sanitization patterns
export const commonSanitizers = {
  text: sanitizeText,
  html: sanitizeHtml,
  email: sanitizeEmail,
  search: sanitizeSearchQuery,
  filename: sanitizeFileName,
  url: sanitizeUrl,
  phone: sanitizePhoneNumber
}