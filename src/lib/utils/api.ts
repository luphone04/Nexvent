import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { sanitizeObject, commonSanitizers } from "./sanitize"

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export function successResponse<T>(
  data: T,
  message?: string,
  pagination?: ApiResponse["pagination"]
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    message,
    pagination,
  })
}

export function errorResponse(
  error: string,
  status: number = 400,
  code?: string
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      code,
    },
    { status }
  )
}

export function handleValidationError(error: ZodError): NextResponse<ApiResponse> {
  const firstError = error.issues?.[0]
  return errorResponse(
    firstError?.message || "Validation failed",
    400,
    "VALIDATION_ERROR"
  )
}

export function handleError(error: unknown): NextResponse<ApiResponse> {
  console.error("API Error:", error)

  if (error instanceof ZodError) {
    return handleValidationError(error)
  }

  if (error instanceof Error) {
    return errorResponse(error.message, 500, "INTERNAL_ERROR")
  }

  return errorResponse("An unexpected error occurred", 500, "UNKNOWN_ERROR")
}

export function createPagination(
  total: number,
  page: number,
  limit: number
): ApiResponse["pagination"] {
  const totalPages = Math.ceil(total / limit)
  return {
    total,
    page,
    limit,
    totalPages,
  }
}

// Sanitize request body for common fields
export function sanitizeRequestBody<T extends Record<string, unknown>>(body: T): T {
  const sanitizers = {
    name: commonSanitizers.text,
    title: commonSanitizers.text,
    description: commonSanitizers.html,
    email: commonSanitizers.email,
    phone: commonSanitizers.phone,
    organization: commonSanitizers.text,
    location: commonSanitizers.text,
    bio: commonSanitizers.html,
    notes: commonSanitizers.html,
    specialRequirements: commonSanitizers.html,
    imageUrl: commonSanitizers.url,
    avatarUrl: commonSanitizers.url
  } as Partial<Record<keyof T, (value: unknown) => unknown>>

  return sanitizeObject(body, sanitizers)
}

// Sanitize search query parameters
export function sanitizeSearchParams(params: URLSearchParams): Record<string, string> {
  const sanitized: Record<string, string> = {}
  
  for (const [key, value] of params.entries()) {
    switch (key) {
      case 'search':
      case 'q':
        sanitized[key] = commonSanitizers.search(value)
        break
      case 'email':
        sanitized[key] = commonSanitizers.email(value)
        break
      default:
        sanitized[key] = commonSanitizers.text(value)
    }
  }
  
  return sanitized
}