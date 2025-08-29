/**
 * Nexvent API Test Suite
 * Comprehensive testing for all API endpoints with sample requests
 */

const BASE_URL = 'http://localhost:3000'

// Test utilities
class APITester {
  constructor(baseURL = BASE_URL) {
    this.baseURL = baseURL
    this.authToken = null
    this.results = []
  }

  async request(method, endpoint, data = null, headers = {}) {
    const url = `${this.baseURL}${endpoint}`
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    }

    if (this.authToken) {
      options.headers['Authorization'] = `Bearer ${this.authToken}`
    }

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data)
    }

    try {
      const response = await fetch(url, options)
      const result = await response.json()
      
      return {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        data: result,
        success: response.ok
      }
    } catch (error) {
      return {
        status: 0,
        error: error.message,
        success: false
      }
    }
  }

  async authenticate(email, password) {
    const response = await this.request('POST', '/api/auth/signin', {
      email,
      password
    })
    
    if (response.success) {
      this.authToken = response.data.accessToken || 'mock-token'
      console.log('✓ Authentication successful')
    } else {
      console.log('✗ Authentication failed:', response.data.error)
    }
    
    return response.success
  }

  logTest(name, response) {
    const result = {
      test: name,
      status: response.status,
      success: response.success,
      timestamp: new Date().toISOString()
    }
    
    this.results.push(result)
    
    const status = response.success ? '✓' : '✗'
    const statusText = `${response.status}${response.error ? ` (${response.error})` : ''}`
    console.log(`${status} ${name} - ${statusText}`)
    
    if (!response.success && response.data) {
      console.log('  Error:', response.data.error || response.data.message)
    }
  }

  async runTest(name, testFunction) {
    try {
      const response = await testFunction()
      this.logTest(name, response)
      return response
    } catch (error) {
      this.logTest(name, { success: false, status: 0, error: error.message })
      return { success: false, error: error.message }
    }
  }

  getSummary() {
    const total = this.results.length
    const passed = this.results.filter(r => r.success).length
    const failed = total - passed
    
    return { total, passed, failed, passRate: (passed / total * 100).toFixed(1) }
  }
}

// Sample test data
const testData = {
  admin: {
    email: 'admin@test.com',
    password: 'password123'
  },
  organizer: {
    email: 'organizer@test.com',
    password: 'password123'
  },
  attendee: {
    email: 'attendee@test.com',
    password: 'password123'
  },
  event: {
    title: 'API Test Conference',
    description: 'Testing event creation via API',
    eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    eventTime: '10:00',
    location: 'API Test Center',
    capacity: 100,
    category: 'CONFERENCE',
    ticketPrice: 25.00
  },
  registration: {
    notes: 'API test registration'
  }
}

// Test suites
async function runEventAPITests(tester) {
  console.log('\n=== Event API Tests ===')
  
  // Test getting events
  await tester.runTest('Get events list', () => 
    tester.request('GET', '/api/events?page=1&limit=5')
  )
  
  // Test event search
  await tester.runTest('Search events', () => 
    tester.request('GET', '/api/events?search=conference&category=CONFERENCE')
  )
  
  // Test creating event (requires organizer auth)
  const createResponse = await tester.runTest('Create event', () => 
    tester.request('POST', '/api/events', testData.event)
  )
  
  let eventId = null
  if (createResponse.success && createResponse.data.data) {
    eventId = createResponse.data.data.id
    console.log(`  Created event ID: ${eventId}`)
  }
  
  if (eventId) {
    // Test getting single event
    await tester.runTest('Get event by ID', () => 
      tester.request('GET', `/api/events/${eventId}`)
    )
    
    // Test updating event
    await tester.runTest('Update event', () => 
      tester.request('PUT', `/api/events/${eventId}`, {
        title: 'Updated API Test Conference'
      })
    )
    
    // Test generating event QR code
    await tester.runTest('Generate event QR code', () => 
      tester.request('GET', `/api/events/${eventId}/qrcode?type=registration`)
    )
  }
  
  return eventId
}

async function runRegistrationAPITests(tester, eventId) {
  console.log('\n=== Registration API Tests ===')
  
  if (!eventId) {
    console.log('Skipping registration tests - no event ID available')
    return
  }
  
  // Test event registration
  const regResponse = await tester.runTest('Create registration', () => 
    tester.request('POST', '/api/registrations', {
      eventId,
      ...testData.registration
    })
  )
  
  let registrationId = null
  if (regResponse.success && regResponse.data.data) {
    registrationId = regResponse.data.data.id
    console.log(`  Created registration ID: ${registrationId}`)
  }
  
  // Test getting registrations
  await tester.runTest('Get registrations list', () => 
    tester.request('GET', '/api/registrations')
  )
  
  if (registrationId) {
    // Test getting single registration
    await tester.runTest('Get registration by ID', () => 
      tester.request('GET', `/api/registrations/${registrationId}`)
    )
    
    // Test registration QR code
    await tester.runTest('Generate registration QR code', () => 
      tester.request('GET', `/api/registrations/${registrationId}/qrcode`)
    )
    
    // Test check-in validation
    await tester.runTest('Validate check-in code', () => 
      tester.request('POST', '/api/checkin/validate', {
        code: 'TEST123',
        eventId
      })
    )
  }
  
  return registrationId
}

async function runAttendeeAPITests(tester) {
  console.log('\n=== Attendee API Tests ===')
  
  // Test getting attendees
  await tester.runTest('Get attendees list', () => 
    tester.request('GET', '/api/attendees?page=1&limit=10')
  )
  
  // Test attendee search
  await tester.runTest('Search attendees', () => 
    tester.request('GET', '/api/attendees/search?q=test&type=all')
  )
}

async function runCheckInAPITests(tester, eventId) {
  console.log('\n=== Check-in API Tests ===')
  
  if (!eventId) {
    console.log('Skipping check-in tests - no event ID available')
    return
  }
  
  // Test getting check-in stats
  await tester.runTest('Get check-in statistics', () => 
    tester.request('GET', `/api/events/${eventId}/checkin`)
  )
  
  // Test event registrations
  await tester.runTest('Get event registrations', () => 
    tester.request('GET', `/api/events/${eventId}/registrations`)
  )
}

async function runQRCodeAPITests(tester, eventId) {
  console.log('\n=== QR Code API Tests ===')
  
  if (!eventId) {
    console.log('Skipping QR code tests - no event ID available')
    return
  }
  
  // Test event info QR code
  await tester.runTest('Generate event info QR code', () => 
    tester.request('GET', `/api/events/${eventId}/qrcode?type=info`)
  )
}

async function runAdminAPITests(tester) {
  console.log('\n=== Admin API Tests ===')
  
  // Test admin stats
  await tester.runTest('Get admin statistics', () => 
    tester.request('GET', '/api/admin/stats')
  )
  
  // Test admin logs
  await tester.runTest('Get API logs', () => 
    tester.request('GET', '/api/admin/logs?limit=10')
  )
  
  // Test batch operations (sample)
  await tester.runTest('Test batch operation structure', () => 
    tester.request('POST', '/api/admin/batch', {
      type: 'users',
      action: 'promote',
      userIds: ['nonexistent'],
      newRole: 'ORGANIZER',
      reason: 'API test'
    })
  )
}

async function runRateLimitTests(tester) {
  console.log('\n=== Rate Limiting Tests ===')
  
  // Test rate limiting by making rapid requests
  const promises = []
  for (let i = 0; i < 5; i++) {
    promises.push(
      tester.runTest(`Rate limit test ${i + 1}`, () => 
        tester.request('GET', '/api/events')
      )
    )
  }
  
  await Promise.all(promises)
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Nexvent API Test Suite\n')
  
  const tester = new APITester()
  
  try {
    // Test as organizer for most functionality
    console.log('=== Authentication Test ===')
    const authSuccess = await tester.authenticate(testData.organizer.email, testData.organizer.password)
    
    if (!authSuccess) {
      console.log('⚠️  Authentication failed - running limited tests')
    }
    
    // Run test suites
    const eventId = await runEventAPITests(tester)
    await runAttendeeAPITests(tester)
    const registrationId = await runRegistrationAPITests(tester, eventId)
    await runCheckInAPITests(tester, eventId)
    await runQRCodeAPITests(tester, eventId)
    
    // Test as admin for admin functionality
    console.log('\n=== Switching to Admin User ===')
    await tester.authenticate(testData.admin.email, testData.admin.password)
    await runAdminAPITests(tester)
    
    // Rate limiting tests (should be last)
    await runRateLimitTests(tester)
    
  } catch (error) {
    console.error('Test suite error:', error)
  }
  
  // Print summary
  console.log('\n=== Test Summary ===')
  const summary = tester.getSummary()
  console.log(`Total Tests: ${summary.total}`)
  console.log(`Passed: ${summary.passed}`)
  console.log(`Failed: ${summary.failed}`)
  console.log(`Pass Rate: ${summary.passRate}%`)
  
  if (summary.failed > 0) {
    console.log('\nFailed Tests:')
    tester.results.filter(r => !r.success).forEach(result => {
      console.log(`- ${result.test} (${result.status})`)
    })
  }
  
  console.log('\n🎯 API Test Suite Complete')
}

// Performance test utilities
function createPerformanceTest(name, requests) {
  return {
    name,
    requests,
    async run(tester) {
      console.log(`\n=== Performance Test: ${name} ===`)
      const startTime = Date.now()
      
      const promises = requests.map((req, index) => 
        tester.runTest(`${name} request ${index + 1}`, () => 
          tester.request(req.method, req.endpoint, req.data)
        )
      )
      
      await Promise.all(promises)
      
      const duration = Date.now() - startTime
      console.log(`Completed ${requests.length} requests in ${duration}ms`)
      console.log(`Average: ${(duration / requests.length).toFixed(2)}ms per request`)
    }
  }
}

// Export for use in other test files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    APITester,
    runAllTests,
    createPerformanceTest,
    testData
  }
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(console.error)
}