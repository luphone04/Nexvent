import { NextResponse } from "next/server"
import { ZodError } from "zod"

export interface ApiResponse<T = any> {
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