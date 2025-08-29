import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory rate limiting (for production, use Redis)
const requestCounts = new Map<string, { count: number; resetTime: number }>()

interface RateLimitConfig {
  windowMs: number  // Time window in milliseconds
  maxRequests: number  // Maximum requests per window
  message?: string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

export function createRateLimit(config: RateLimitConfig) {
  return async (request: NextRequest) => {
    const ip = request.ip || 
               request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown'

    const now = Date.now()
    const windowStart = now - config.windowMs
    
    // Get current count for this IP
    const currentData = requestCounts.get(ip)
    
    // Reset if window has passed
    if (!currentData || currentData.resetTime < now) {
      requestCounts.set(ip, {
        count: 1,
        resetTime: now + config.windowMs
      })
      return { success: true, limit: config.maxRequests, remaining: config.maxRequests - 1 }
    }
    
    // Check if limit exceeded
    if (currentData.count >= config.maxRequests) {
      const resetInMs = currentData.resetTime - now
      const resetInSeconds = Math.ceil(resetInMs / 1000)
      
      return {
        success: false,
        error: config.message || "Too many requests",
        retryAfter: resetInSeconds,
        limit: config.maxRequests,
        remaining: 0
      }
    }
    
    // Increment count
    currentData.count++
    requestCounts.set(ip, currentData)
    
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - currentData.count
    }
  }
}

// Predefined rate limits for different endpoint types
export const rateLimits = {
  // General API endpoints
  general: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: "Too many requests. Please try again later."
  }),
  
  // Authentication endpoints
  auth: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,
    message: "Too many authentication attempts. Please try again later."
  }),
  
  // Registration endpoints
  registration: createRateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 20,
    message: "Too many registration requests. Please slow down."
  }),
  
  // Upload endpoints
  upload: createRateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    maxRequests: 10,
    message: "Too many file uploads. Please wait before uploading again."
  }),
  
  // Admin batch operations
  adminBatch: createRateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 5,
    message: "Too many batch operations. Please wait before performing more batch actions."
  }),
  
  // QR code generation
  qrCode: createRateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 10,
    message: "Too many QR code generation requests."
  })
}

// Cleanup function to remove expired entries
export function cleanupRateLimitData() {
  const now = Date.now()
  for (const [ip, data] of requestCounts.entries()) {
    if (data.resetTime < now) {
      requestCounts.delete(ip)
    }
  }
}

// Run cleanup every hour
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitData, 60 * 60 * 1000)
}