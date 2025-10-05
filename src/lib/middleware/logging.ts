import { NextRequest } from 'next/server'

export interface RequestLog {
  timestamp: string
  method: string
  url: string
  userAgent?: string
  ip: string
  userId?: string
  userRole?: string
  responseStatus?: number
  responseTime?: number
  error?: string
  requestId: string
}

// Generate unique request ID
function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// Format log entry for console output
function formatLogEntry(log: RequestLog): string {
  const { timestamp, method, url, ip, userId, userRole, responseStatus, responseTime, error } = log
  
  const parts = [
    `[${timestamp}]`,
    `${method} ${url}`,
    `IP: ${ip}`,
    userId ? `User: ${userId} (${userRole})` : 'Anonymous',
    responseStatus ? `Status: ${responseStatus}` : '',
    responseTime ? `Time: ${responseTime}ms` : '',
    error ? `Error: ${error}` : ''
  ].filter(Boolean)
  
  return parts.join(' | ')
}

// Enhanced logging for API requests
export class APILogger {
  private static logs: RequestLog[] = []
  private static maxLogs = 1000 // Keep last 1000 logs in memory
  
  static logRequest(request: NextRequest, currentUser?: unknown): RequestLog {
    const requestId = generateRequestId()
    const timestamp = new Date().toISOString()
    
    const log: RequestLog = {
      requestId,
      timestamp,
      method: request.method,
      url: request.url,
      userAgent: request.headers.get('user-agent') || undefined,
      ip: request.headers.get('x-forwarded-for')?.split(',')[0] ||
          request.headers.get('x-real-ip') ||
          'unknown',
      userId: (currentUser as { id?: string })?.id,
      userRole: (currentUser as { role?: string })?.role
    }
    
    // Add to memory log
    this.logs.push(log)
    
    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }
    
    // Console log for development
    console.log(`[REQUEST] ${formatLogEntry(log)}`)
    
    return log
  }
  
  static logResponse(requestId: string, status: number, responseTime: number, error?: string) {
    const log = this.logs.find(l => l.requestId === requestId)
    if (log) {
      log.responseStatus = status
      log.responseTime = responseTime
      log.error = error
      
      // Console log for development
      console.log(`[RESPONSE] ${formatLogEntry(log)}`)
    }
  }
  
  static getLogs(filter?: {
    method?: string
    userId?: string
    status?: number
    fromDate?: Date
    toDate?: Date
    limit?: number
  }): RequestLog[] {
    let filteredLogs = [...this.logs]
    
    if (filter?.method) {
      filteredLogs = filteredLogs.filter(log => log.method === filter.method)
    }
    
    if (filter?.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === filter.userId)
    }
    
    if (filter?.status) {
      filteredLogs = filteredLogs.filter(log => log.responseStatus === filter.status)
    }
    
    if (filter?.fromDate) {
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= filter.fromDate!)
    }
    
    if (filter?.toDate) {
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= filter.toDate!)
    }
    
    // Sort by timestamp descending
    filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    
    if (filter?.limit) {
      filteredLogs = filteredLogs.slice(0, filter.limit)
    }
    
    return filteredLogs
  }
  
  static getStats() {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    const recentLogs = this.logs.filter(log => new Date(log.timestamp) >= oneHourAgo)
    const dailyLogs = this.logs.filter(log => new Date(log.timestamp) >= oneDayAgo)
    
    return {
      total: this.logs.length,
      lastHour: recentLogs.length,
      lastDay: dailyLogs.length,
      byMethod: this.logs.reduce((acc, log) => {
        acc[log.method] = (acc[log.method] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      byStatus: this.logs.reduce((acc, log) => {
        if (log.responseStatus) {
          const statusRange = `${Math.floor(log.responseStatus / 100)}xx`
          acc[statusRange] = (acc[statusRange] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>),
      errors: this.logs.filter(log => log.error).length,
      authenticated: this.logs.filter(log => log.userId).length,
      anonymous: this.logs.filter(log => !log.userId).length
    }
  }
  
  static clearLogs() {
    this.logs = []
  }
}

// Middleware wrapper for API routes
export function withLogging(handler: (request: NextRequest, ...args: unknown[]) => Promise<Response>) {
  return async (request: NextRequest, ...args: unknown[]) => {
    const startTime = Date.now()
    let requestLog: RequestLog | null = null
    
    try {
      // Log request (this would need currentUser context)
      requestLog = APILogger.logRequest(request)
      
      // Execute handler
      const response = await handler(request, ...args)
      
      // Log successful response
      const responseTime = Date.now() - startTime
      APILogger.logResponse(requestLog.requestId, response.status || 200, responseTime)
      
      return response
      
    } catch (error) {
      // Log error response
      const responseTime = Date.now() - startTime
      if (requestLog) {
        APILogger.logResponse(requestLog.requestId, 500, responseTime, error instanceof Error ? error.message : String(error))
      }
      
      throw error
    }
  }
}