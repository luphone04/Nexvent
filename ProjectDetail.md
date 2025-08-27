# Event Management Platform - Project Proposal

## Project Overview
A comprehensive event management platform that allows event organizers to create and manage events while enabling attendees to discover, register for, and track their event participation across various event types and industries.

## Team Members
- [Your Name] - GitHub: [your-github-username]
- [Member 2 Name] - GitHub: [member2-github-username]
- [Member 3 Name] - GitHub: [member3-github-username]

## Project Description
The Event Management Platform serves as a centralized hub for event organization and attendance tracking. Event organizers can create detailed events, manage capacity, and track registrations, while attendees can browse events, register, and manage their participation.

## Core Features & CRUD Operations

### 1. Event Management (CRUD Entity #1)
**Purpose**: Core event information and management

**CRUD Operations**:
- **Create**: Event organizers create new events
- **Read**: Browse all events, filter by category/date/location
- **Update**: Modify event details, update capacity, change status
- **Delete**: Cancel/remove events (with proper validation)

**Database Fields**:
```
- id (Primary Key)
- title (String, required)
- description (Text)
- event_date (DateTime, required)
- event_time (Time)
- location (String, required)
- capacity (Integer, required)
- category (Enum: Conference, Workshop, Seminar, Social, Sports, Concert, Meetup, Training)
- ticket_price (Decimal, default: 0)
- organizer_id (Foreign Key to User)
- image_url (String, nullable) // Event poster/image
- status (Enum: Draft, Published, Cancelled, Completed)
- created_at (DateTime)
- updated_at (DateTime)
```

### 2. Attendee Management (CRUD Entity #2)
**Purpose**: User profiles and attendee information

**CRUD Operations**:
- **Create**: User registration and profile creation
- **Read**: View attendee profiles, search users
- **Update**: Edit profile information, preferences
- **Delete**: Deactivate user accounts

**Database Fields**:
```
- id (Primary Key)
- name (String, required)
- email (String, unique, required)
- phone (String)
- organization (String) // Company/organization they represent
- bio (Text)
- interests (String array) // Event categories they're interested in
- role (Enum: Attendee, Organizer, Admin)
- avatar_url (String)
- created_at (DateTime)
- updated_at (DateTime)
```

### 3. Registration Management (CRUD Entity #3)
**Purpose**: Track event registrations and attendance

**CRUD Operations**:
- **Create**: Register for events
- **Read**: View registration history, check event attendees
- **Update**: Modify registration status, check-in attendees
- **Delete**: Cancel registrations (with business rules)

**Database Fields**:
```
- id (Primary Key)
- event_id (Foreign Key to Event)
- attendee_id (Foreign Key to Attendee)
- registration_date (DateTime)
- status (Enum: Registered, Waitlisted, Cancelled, Attended, No-Show)
- payment_status (Enum: Pending, Paid, Refunded)
- check_in_code (String, unique) // Unique identifier for QR code
- check_in_time (DateTime, nullable)
- waitlist_position (Integer, nullable) // Position in waitlist if applicable
- special_requirements (Text)
- created_at (DateTime)
- updated_at (DateTime)
```

## Technical Implementation

### Technology Stack
- **Frontend**: Next.js 14 with App Router
- **Backend**: Next.js API Routes (implementing REST API)
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS + shadcn/ui components
- **Authentication**: NextAuth.js with JWT tokens
- **QR Code Generation**: qrcode npm package
- **QR Code Scanning**: html5-qrcode library (for organizers)
- **File Upload**: For event images/avatars
- **Email Service**: Resend or SendGrid for notifications
- **Deployment**: Vercel

### REST API Endpoints

#### Event Management API (`/api/events`)
```
GET    /api/events           - List all events (with filters)
GET    /api/events/[id]      - Get specific event details
POST   /api/events           - Create new event
PUT    /api/events/[id]      - Update event
DELETE /api/events/[id]      - Delete event

Query Parameters for GET /api/events:
- ?category=workshop
- ?date_from=2024-01-01
- ?date_to=2024-12-31
- ?location=Downtown
- ?organizer_id=123
- ?price_min=0
- ?price_max=100
```

#### Attendee Management API (`/api/attendees`)
```
GET    /api/attendees        - List all attendees
GET    /api/attendees/[id]   - Get attendee profile
POST   /api/attendees        - Create attendee account
PUT    /api/attendees/[id]   - Update attendee profile
DELETE /api/attendees/[id]   - Delete attendee account

Query Parameters for GET /api/attendees:
- ?role=organizer
- ?organization=Tech Corp
- ?interests=technology,workshop
```

#### Registration Management API (`/api/registrations`)
```
GET    /api/registrations           - List registrations (filtered by user)
GET    /api/registrations/[id]      - Get specific registration
POST   /api/registrations           - Create registration (auto-generates QR code)
PUT    /api/registrations/[id]      - Update registration status
DELETE /api/registrations/[id]      - Cancel registration

Additional endpoints:
GET    /api/events/[id]/registrations    - Get all registrations for an event
GET    /api/attendees/[id]/registrations - Get all registrations for an attendee
POST   /api/registrations/[id]/checkin   - Check-in attendee via QR code
GET    /api/registrations/[id]/qr        - Generate/retrieve QR code for registration
```

#### Authentication API (`/api/auth`)
```
POST   /api/auth/login       - User login
POST   /api/auth/register    - User registration
POST   /api/auth/logout      - User logout
GET    /api/auth/profile     - Get current user profile
```

### Database Relationships
```
Event ← (1:M) → Registration ← (M:1) → Attendee
- One Event can have many Registrations
- One Attendee can have many Registrations
- Registration is the junction table with additional data
```

## REST API Implementation Details

### API Response Format
All API endpoints will follow REST conventions and return JSON responses:

```javascript
// Success Response
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}

// Error Response  
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}

// List Response with Pagination
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

### HTTP Status Codes
- **200 OK**: Successful GET, PUT requests
- **201 Created**: Successful POST requests
- **204 No Content**: Successful DELETE requests
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Duplicate registration, capacity exceeded
- **500 Internal Server Error**: Server errors

### API Authentication
- JWT tokens for API authentication
- Include in Authorization header: `Bearer <token>`
- Token contains user ID and role for authorization
- Protected routes check user permissions

### Example API Usage

#### Create Event (POST /api/events)
```javascript
// Request
POST /api/events
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "React Workshop",
  "description": "Learn React basics",
  "event_date": "2024-03-15T10:00:00Z",
  "location": "Room 301",
  "capacity": 30,
  "category": "workshop"
}

// Response (201 Created)
{
  "success": true,
  "data": {
    "id": 123,
    "title": "React Workshop",
    "description": "Learn React basics",
    "event_date": "2024-03-15T10:00:00Z",
    "location": "Room 301",
    "capacity": 30,
    "category": "workshop",
    "organizer_id": 456,
    "status": "draft",
    "created_at": "2024-01-20T08:00:00Z"
  },
  "message": "Event created successfully"
}
```

#### Register for Event (POST /api/registrations)
```javascript
// Request
POST /api/registrations
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "event_id": 123,
  "special_requirements": "Vegetarian meal"
}

// Response (201 Created)
{
  "success": true,
  "data": {
    "id": 789,
    "event_id": 123,
    "attendee_id": 456,
    "registration_date": "2024-01-20T09:00:00Z",
    "status": "registered",
    "check_in_code": "uuid-generated-code",
    "special_requirements": "Vegetarian meal"
  },
  "message": "Registration successful with QR code generated"
}

// Error Response (409 Conflict - Event Full)
{
  "success": false,
  "error": "Event has reached maximum capacity",
  "code": "EVENT_FULL"
}
```

#### Generate QR Code (GET /api/registrations/[id]/qr)
```javascript
// Response (200 OK)
{
  "success": true,
  "data": {
    "qr_code_data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "check_in_code": "uuid-generated-code",
    "event_title": "React Workshop",
    "attendee_name": "John Doe"
  },
  "message": "QR code generated successfully"
}
```

#### Check-in via QR Code (POST /api/registrations/[id]/checkin)
```javascript
// Request
POST /api/registrations/789/checkin
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "qr_data": "{\"registration_id\":\"789\",\"check_in_code\":\"uuid-code\",\"type\":\"event_checkin\"}"
}

// Response (200 OK)
{
  "success": true,
  "data": {
    "attendee_name": "John Doe",
    "event_title": "React Workshop",
    "check_in_time": "2024-03-15T10:15:00Z",
    "status": "attended"
  },
  "message": "Check-in successful!"
}

// Error Response (409 Conflict - Already Checked In)
{
  "success": false,
  "error": "Attendee already checked in at 2024-03-15T10:15:00Z",
  "code": "ALREADY_CHECKED_IN"
}
```

#### 1. Event Discovery & Search
- **Filter by**: Date range, category, location, price
- **Search**: Event title, description, organizer name
- **Sort by**: Date, popularity, price, newest

#### 2. Registration Management
- **Capacity Control**: Prevent overbooking with real-time capacity checking
- **Waitlist System**: Automatic queue management when events are full
- **QR Code Generation**: Unique QR codes generated for each registration
- **QR Code Check-in**: Mobile-friendly QR scanning for event entry
- **Automated Emails**: Registration confirmations with embedded QR codes
- **Email QR Delivery**: QR codes sent via email for easy access

#### 3. Dashboard & Analytics
- **Organizer Dashboard**: Event performance, attendee stats
- **Attendee Dashboard**: Upcoming events, registration history
- **Admin Panel**: System-wide statistics

## User Roles & Permissions

### 1. Attendee
- Browse and search events across all categories
- Register for free and paid events
- View personal registration history and upcoming events
- Update profile information and interests
- Cancel registrations (with time and policy restrictions)
- Receive event notifications and reminders

### 2. Event Organizer
- All attendee permissions
- Create and manage their own events
- Set event pricing and capacity limits
- View attendee lists and manage registrations
- Check-in attendees at events
- Access event analytics and reports
- Upload event images and materials

### 3. Admin
- All organizer permissions
- Manage all events and users across the platform
- Platform-wide analytics and reporting
- User role management and permissions
- Content moderation and event approval
- System configuration and settings

## Key Pages & Components

### Frontend Pages
1. **Home Page**: Featured events, search functionality
2. **Events List**: Filterable event catalog
3. **Event Detail**: Full event information + registration
4. **Dashboard**: Role-based user dashboard
5. **Profile Management**: User settings and preferences
6. **Admin Panel**: System management (admin only)

### Reusable Components
- EventCard (for listings)
- RegistrationForm
- SearchFilters
- AttendeeList
- QRCodeDisplay (for showing QR codes)
- QRScanner (for organizer check-in)
- Dashboard widgets

## Business Logic Examples

### Registration Validation
```javascript
// Example business rules
- Cannot register for past events
- Cannot register twice for same event
- Cannot exceed event capacity (triggers waitlist)
- Must be logged in to register
- Free events: immediate confirmation with QR code
- Paid events: pending until payment, QR generated after payment
- QR codes are unique per registration and contain encrypted data
- Check-in codes expire after event completion
```

### Event Status Management
```javascript
// Automatic status updates
- Draft → Published (when organizer publishes)
- Published → Completed (after event date)
- Any status → Cancelled (manual cancellation)
```

## Development Timeline (6 weeks)

### Week 1: Foundation
- Project setup and database design
- Authentication system
- Basic layout and navigation

### Week 2: REST API Development
- Design and implement REST API endpoints
- Event CRUD API with proper HTTP methods
- API authentication and authorization
- Error handling and validation

### Week 3: Event Management
- Event CRUD operations via API
- Event listing and detail pages
- Image upload functionality
- Frontend-API integration

### Week 4: User & Registration Management  
- Attendee CRUD API endpoints
- Registration CRUD API endpoints with QR code generation
- QR code display and email integration
- User profiles and dashboard
- Registration flow with API calls

### Week 5: Advanced Features
- QR code scanning functionality for organizers
- Search and filtering APIs
- Waitlist management system
- Email notifications with QR codes
- Dashboard analytics with API data

### Week 6: Polish & Deployment
- API testing and documentation
- Frontend UI/UX improvements
- Deployment and video creation

## Innovation Elements

1. **QR Code Check-in System**: 
   - Unique QR codes generated automatically upon registration
   - QR codes contain encrypted registration data for security
   - Mobile-friendly scanning interface for organizers
   - Email delivery of QR codes as both embedded images and attachments
   - Real-time check-in validation with duplicate prevention

2. **Smart Notifications**: Automated reminders and updates
3. **Waitlist Management**: Automatic promotion when spots open
4. **Social Features**: Event sharing, attendee networking
5. **Mobile-Responsive**: Works seamlessly on all devices
6. **Real-time Updates**: Live capacity updates, instant registration feedback

## Technical Challenges & Solutions

### Challenge 1: Capacity Management
**Problem**: Preventing race conditions in event registration
**Solution**: Database transactions and proper constraint handling

### Challenge 2: Date/Time Handling
**Problem**: Managing events across different time zones
**Solution**: Store UTC timestamps, display in user's timezone

### Challenge 3: QR Code Security & Validation
**Problem**: Ensuring QR codes cannot be duplicated or forged
**Solution**: Unique UUID generation, encrypted data payload, server-side validation, and expiration handling

### Challenge 4: Complex Filtering
**Problem**: Multiple filter combinations with good performance
**Solution**: Indexed database queries with Prisma, client-side state management

## Success Metrics
- ✅ All CRUD operations working for 3 entities
- ✅ Proper user authentication and authorization
- ✅ QR code generation and scanning functionality
- ✅ Email delivery system with QR codes
- ✅ Responsive design works on mobile/desktop
- ✅ Event registration prevents overbooking
- ✅ Waitlist management with automatic promotion
- ✅ Search and filter functionality
- ✅ Clean, documented code on GitHub
- ✅ Deployed application with stable performance