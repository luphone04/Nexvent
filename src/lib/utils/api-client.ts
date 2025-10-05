/**
 * API client utility that handles basePath automatically
 */

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || ''

export const apiClient = {
  get: async (path: string, options?: RequestInit) => {
    const url = `${BASE_PATH}${path}`
    return fetch(url, {
      ...options,
      method: 'GET',
    })
  },

  post: async (path: string, data?: unknown, options?: RequestInit) => {
    const url = `${BASE_PATH}${path}`
    return fetch(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    })
  },

  put: async (path: string, data?: unknown, options?: RequestInit) => {
    const url = `${BASE_PATH}${path}`
    return fetch(url, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    })
  },

  delete: async (path: string, options?: RequestInit) => {
    const url = `${BASE_PATH}${path}`
    return fetch(url, {
      ...options,
      method: 'DELETE',
    })
  },

  // For custom fetch calls
  fetch: async (path: string, options?: RequestInit) => {
    const url = `${BASE_PATH}${path}`
    return fetch(url, options)
  },
}
