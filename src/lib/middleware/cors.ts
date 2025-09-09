import { NextRequest, NextResponse } from 'next/server'

export function corsMiddleware(request: NextRequest) {
  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
        'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
        'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
        'Access-Control-Allow-Credentials': 'true'
      }
    })
  }

  return null // Continue to the next middleware/handler
}

// Utility function to add CORS headers to API responses
export function addCorsHeaders(response: NextResponse, request?: NextRequest): NextResponse {
  const origin = request?.headers.get('Origin')
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*']
  
  // Check if the origin is allowed
  const isOriginAllowed = allowedOrigins.includes('*') || 
                         (origin && allowedOrigins.includes(origin))

  if (isOriginAllowed) {
    response.headers.set('Access-Control-Allow-Origin', origin || '*')
  }

  response.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  response.headers.set(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  )
  response.headers.set('Access-Control-Allow-Credentials', 'true')

  return response
}

// Helper function to create a CORS-enabled response
export function corsResponse(data: unknown, status = 200, request?: NextRequest): NextResponse {
  const response = NextResponse.json(data, { status })
  return addCorsHeaders(response, request)
}