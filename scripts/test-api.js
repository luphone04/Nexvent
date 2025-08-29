#!/usr/bin/env node

/**
 * API Test Runner
 * Simple script to test Nexvent API endpoints
 */

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000'

// Simple test utilities (Node.js compatible)
async function makeRequest(method, url, data = null, headers = {}) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  }

  if (data) {
    options.body = JSON.stringify(data)
  }

  try {
    const response = await fetch(url, options)
    const result = await response.json()
    return {
      status: response.status,
      success: response.ok,
      data: result
    }
  } catch (error) {
    return {
      status: 0,
      success: false,
      error: error.message
    }
  }
}

// Test cases
const tests = [
  {
    name: 'Health Check - Get Events',
    method: 'GET',
    endpoint: '/api/events',
    expectedStatus: [200, 401] // 401 if auth required
  },
  {
    name: 'Event Search',
    method: 'GET',
    endpoint: '/api/events?search=test&limit=5',
    expectedStatus: [200, 401]
  },
  {
    name: 'Get Attendees',
    method: 'GET',
    endpoint: '/api/attendees',
    expectedStatus: [200, 401]
  },
  {
    name: 'Search Attendees',
    method: 'GET',
    endpoint: '/api/attendees/search?q=test',
    expectedStatus: [200, 401]
  },
  {
    name: 'Validate Non-existent Check-in Code',
    method: 'POST',
    endpoint: '/api/checkin/validate',
    data: { code: 'INVALID123' },
    expectedStatus: [200, 401, 422]
  },
  {
    name: 'Get Event QR Code (should fail without auth)',
    method: 'GET',
    endpoint: '/api/events/test-event/qrcode',
    expectedStatus: [401, 404]
  }
]

async function runTests() {
  console.log(`🧪 Testing Nexvent API at ${BASE_URL}\n`)
  
  const results = []
  
  for (const test of tests) {
    const url = `${BASE_URL}${test.endpoint}`
    console.log(`Testing: ${test.name}`)
    console.log(`  ${test.method} ${test.endpoint}`)
    
    const response = await makeRequest(test.method, url, test.data)
    const isExpected = test.expectedStatus.includes(response.status)
    
    results.push({
      ...test,
      response,
      passed: isExpected
    })
    
    const status = isExpected ? '✓' : '✗'
    console.log(`  ${status} Status: ${response.status} ${isExpected ? '(expected)' : '(unexpected)'}`)
    
    if (response.data?.message) {
      console.log(`  Message: ${response.data.message}`)
    }
    
    if (response.error) {
      console.log(`  Error: ${response.error}`)
    }
    
    console.log('')
  }
  
  // Summary
  const passed = results.filter(r => r.passed).length
  const total = results.length
  
  console.log('=== Test Summary ===')
  console.log(`Total: ${total}`)
  console.log(`Passed: ${passed}`)
  console.log(`Failed: ${total - passed}`)
  console.log(`Success Rate: ${(passed/total * 100).toFixed(1)}%`)
  
  if (passed < total) {
    console.log('\nFailed Tests:')
    results.filter(r => !r.passed).forEach(test => {
      console.log(`- ${test.name}: got ${test.response.status}, expected ${test.expectedStatus.join(' or ')}`)
    })
  }
  
  return results
}

// Run if called directly
if (require.main === module) {
  runTests().then(results => {
    const allPassed = results.every(r => r.passed)
    process.exit(allPassed ? 0 : 1)
  }).catch(error => {
    console.error('Test runner error:', error)
    process.exit(1)
  })
}

module.exports = { runTests, makeRequest }