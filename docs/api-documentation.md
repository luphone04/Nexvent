# Nexvent API Documentation

A comprehensive REST API for the Event Management Platform built with Next.js 14 and PostgreSQL.

## Table of Contents

- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Events API](#events-api)
- [Attendees API](#attendees-api)
- [Registrations API](#registrations-api)
- [QR Code API](#qr-code-api)
- [Check-in API](#check-in-api)
- [Admin API](#admin-api)
- [Batch Operations](#batch-operations)

## Authentication

All API endpoints require authentication via JWT tokens provided by NextAuth.js.

### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### User Roles
- **ATTENDEE**: Basic user, can register for events and manage own profile
- **ORGANIZER**: Can create and manage events, view registrations
- **ADMIN**: Full access to all resources and admin operations

## Rate Limiting

API endpoints have different rate limits based on their type:

| Endpoint Type | Window | Requests | Description |
|--------------|--------|----------|-------------|
| General API | 15 min | 100 | Standard API operations |
| Authentication | 15 min | 10 | Login/logout attempts |
| Registration | 5 min | 20 | Event registrations |
| Upload | 10 min | 10 | File uploads |
| QR Code | 1 min | 10 | QR code generation |
| Admin Batch | 5 min | 5 | Batch operations |

Rate limit headers are returned with each response:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully",
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

## Error Handling

### HTTP Status Codes

| Status | Description |
|--------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 429 | Rate Limited |
| 500 | Internal Server Error |

### Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Input validation failed |
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `ALREADY_REGISTERED` | Duplicate registration |
| `EVENT_FULL` | Event at capacity |
| `RATE_LIMITED` | Too many requests |

## Events API

### Get Events
```http
GET /api/events
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Results per page (default: 10, max: 100)
- `category` (string): Filter by event category
- `status` (string): Filter by status (DRAFT, PUBLISHED, CANCELLED, COMPLETED)
- `search` (string): Search in title and description
- `fromDate` (string): Filter events from date (ISO format)
- `toDate` (string): Filter events to date (ISO format)

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "event_123",
      "title": "Tech Conference 2024",
      "description": "Annual technology conference",
      "eventDate": "2024-12-01T09:00:00Z",
      "eventTime": "09:00",
      "location": "Tech Center",
      "capacity": 500,
      "category": "CONFERENCE",
      "ticketPrice": "50.00",
      "status": "PUBLISHED",
      "organizerId": "user_456",
      "registrationCount": 250
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### Get Event by ID
```http
GET /api/events/{id}
```

### Create Event
```http
POST /api/events
```

**Required Role:** ORGANIZER or ADMIN

**Request Body:**
```json
{
  "title": "Tech Conference 2024",
  "description": "Annual technology conference",
  "eventDate": "2024-12-01",
  "eventTime": "09:00",
  "location": "Tech Center",
  "capacity": 500,
  "category": "CONFERENCE",
  "ticketPrice": 50.00,
  "imageUrl": "https://example.com/image.jpg",
  "registrationDeadline": "2024-11-20"
}
```

### Update Event
```http
PUT /api/events/{id}
```

**Required Role:** Event organizer or ADMIN

### Delete Event
```http
DELETE /api/events/{id}
```

**Required Role:** Event organizer or ADMIN

## Attendees API

### Get Attendees
```http
GET /api/attendees
```

**Query Parameters:**
- `page`, `limit`: Pagination
- `role`: Filter by user role
- `organization`: Filter by organization
- `interests`: Comma-separated interests
- `search`: Search in name, organization, bio
- `includePrivate`: Include private profiles (admin only)

### Get Attendee Profile
```http
GET /api/attendees/{id}
```

### Update Attendee Profile
```http
PUT /api/attendees/{id}
```

**Request Body:**
```json
{
  "name": "John Doe",
  "phone": "+1234567890",
  "organization": "Tech Corp",
  "bio": "Software developer with 5 years experience",
  "interests": ["TECHNOLOGY", "WORKSHOP"],
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

### Upload Avatar
```http
POST /api/attendees/{id}/avatar
```

**Content-Type:** multipart/form-data
**Max File Size:** 5MB
**Allowed Types:** JPEG, PNG, WebP

### Update Privacy Settings
```http
PUT /api/attendees/{id}/privacy
```

**Request Body:**
```json
{
  "showEmail": false,
  "showPhone": false,
  "showOrganization": true,
  "showBio": true,
  "showInterests": true,
  "allowSearch": true
}
```

### Search Attendees
```http
GET /api/attendees/search
```

**Query Parameters:**
- `q`: Search query (required)
- `type`: "all", "organizers", "attendees" (default: "all")
- `limit`: Results limit (default: 20, max: 50)

## Registrations API

### Get Registrations
```http
GET /api/registrations
```

**Query Parameters:**
- `page`, `limit`: Pagination
- `status`: Filter by registration status
- `eventId`: Filter by event
- `userId`: Filter by user (admin only)
- `fromDate`, `toDate`: Date range
- `includeExpired`: Include past events

### Create Registration
```http
POST /api/registrations
```

**Request Body:**
```json
{
  "eventId": "event_123",
  "notes": "Special dietary requirements"
}
```

**Response includes waitlist information if event is full:**
```json
{
  "success": true,
  "data": {
    "id": "reg_789",
    "status": "WAITLISTED",
    "waitlistPosition": 5,
    "checkInCode": "ABC123"
  },
  "message": "Added to waitlist at position 5"
}
```

### Get Registration
```http
GET /api/registrations/{id}
```

### Update Registration
```http
PUT /api/registrations/{id}
```

### Cancel Registration
```http
DELETE /api/registrations/{id}
```

**Note:** Attendees cannot cancel less than 24 hours before event

### Get Registration History
```http
GET /api/attendees/{id}/registrations
```

### Get Event Registrations
```http
GET /api/events/{id}/registrations
```

**Required Role:** Event organizer or ADMIN

### Bulk Register Users
```http
POST /api/events/{id}/registrations
```

**Required Role:** Event organizer or ADMIN

**Request Body:**
```json
{
  "userIds": ["user_1", "user_2", "user_3"],
  "notes": "VIP registrations"
}
```

## QR Code API

### Generate Registration QR Code
```http
GET /api/registrations/{id}/qrcode
```

**Response:**
```json
{
  "success": true,
  "data": {
    "registration": {
      "id": "reg_123",
      "checkInCode": "ABC123",
      "attendee": {
        "name": "John Doe"
      },
      "event": {
        "title": "Tech Conference 2024"
      }
    },
    "qrCode": {
      "dataURL": "data:image/png;base64,...",
      "svg": "<svg>...</svg>",
      "data": {
        "type": "EVENT_CHECK_IN",
        "registrationId": "reg_123",
        "checkInCode": "ABC123"
      }
    }
  }
}
```

### Regenerate QR Code
```http
POST /api/registrations/{id}/qrcode
```

**Required Role:** Event organizer or ADMIN

### Generate Event QR Code
```http
GET /api/events/{id}/qrcode?type=registration
```

**Query Parameters:**
- `type`: "registration" or "info" (default: "registration")

## Check-in API

### Check in Attendee
```http
POST /api/events/{id}/checkin
```

**Required Role:** Event organizer or ADMIN

**Request Body:**
```json
{
  "code": "ABC123"
}
```

### Get Check-in Statistics
```http
GET /api/events/{id}/checkin
```

**Required Role:** Event organizer or ADMIN

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "total": 100,
      "registered": 80,
      "attended": 65,
      "waitlisted": 15,
      "cancelled": 5,
      "attendanceRate": 81
    },
    "recentCheckIns": [
      {
        "id": "reg_123",
        "updatedAt": "2024-12-01T10:30:00Z",
        "user": {
          "name": "John Doe"
        }
      }
    ]
  }
}
```

### Validate Check-in Code
```http
POST /api/checkin/validate
```

**Request Body:**
```json
{
  "code": "ABC123",
  "eventId": "event_123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "reasons": [],
    "message": "Ready to check in: John Doe",
    "registration": {
      "id": "reg_123",
      "status": "REGISTERED",
      "attendee": {
        "name": "John Doe"
      },
      "timing": {
        "hoursUntilEvent": 2.5,
        "eventHasPassed": false,
        "canCheckIn": true
      }
    }
  }
}
```

## Admin API

### Get Admin Statistics
```http
GET /api/admin/stats
```

### Get API Logs
```http
GET /api/admin/logs
```

**Query Parameters:**
- `method`: Filter by HTTP method
- `userId`: Filter by user
- `status`: Filter by response status
- `fromDate`, `toDate`: Date range
- `limit`: Results limit (default: 50, max: 500)

### Clear API Logs
```http
DELETE /api/admin/logs
```

## Batch Operations

### Batch Registration Operations
```http
POST /api/admin/batch
```

**Required Role:** ADMIN

**Request Body:**
```json
{
  "type": "registrations",
  "action": "checkin",
  "registrationIds": ["reg_1", "reg_2", "reg_3"],
  "reason": "Bulk check-in for VIP attendees"
}
```

**Available Actions:**
- `cancel`: Cancel registrations
- `checkin`: Check in registered attendees
- `promote`: Promote waitlisted to registered

### Batch Event Operations
```json
{
  "type": "events",
  "action": "publish",
  "eventIds": ["event_1", "event_2"],
  "reason": "Batch publish approved events"
}
```

**Available Actions:**
- `publish`: Publish draft events
- `cancel`: Cancel events
- `archive`: Archive past events

### Batch User Operations
```json
{
  "type": "users",
  "action": "promote",
  "userIds": ["user_1", "user_2"],
  "newRole": "ORGANIZER",
  "reason": "Promote active community members"
}
```

**Available Actions:**
- `promote`: Change user role
- `demote`: Demote to ATTENDEE role

## Webhook Events (Future Implementation)

The API is designed to support webhooks for real-time notifications:

- `registration.created`
- `registration.cancelled`
- `registration.checkedin`
- `event.published`
- `event.cancelled`
- `waitlist.promoted`

## SDK and Libraries

Official SDKs are planned for:
- JavaScript/TypeScript
- Python
- PHP

## Rate Limits and Performance

- All endpoints support pagination
- Large datasets are automatically paginated
- Consider using batch operations for multiple updates
- QR codes are generated on-demand but can be cached
- File uploads are processed asynchronously

## Support

For API support and questions:
- GitHub Issues: [Repository Issues](https://github.com/nexvent/api/issues)
- Email: api-support@nexvent.com
- Documentation: [API Docs](https://docs.nexvent.com/api)

---

*Last updated: December 2024*
*API Version: 1.0*