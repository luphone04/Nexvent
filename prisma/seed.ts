import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clear existing data
  console.log('Clearing existing data...')
  await prisma.registration.deleteMany()
  await prisma.event.deleteMany()
  await prisma.user.deleteMany()

  // Create users
  console.log('Creating users...')

  const hashedPassword = await bcrypt.hash('password123', 10)

  const admin = await prisma.user.create({
    data: {
      email: 'admin@nexvent.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
      organization: 'Nexvent',
    },
  })

  const organizer1 = await prisma.user.create({
    data: {
      email: 'organizer@nexvent.com',
      name: 'Event Organizer',
      password: hashedPassword,
      role: 'ORGANIZER',
      organization: 'Tech Events Inc',
    },
  })

  const organizer2 = await prisma.user.create({
    data: {
      email: 'sarah@events.com',
      name: 'Sarah Johnson',
      password: hashedPassword,
      role: 'ORGANIZER',
      organization: 'Community Events',
    },
  })

  const attendee1 = await prisma.user.create({
    data: {
      email: 'john@example.com',
      name: 'John Doe',
      password: hashedPassword,
      role: 'ATTENDEE',
    },
  })

  const attendee2 = await prisma.user.create({
    data: {
      email: 'jane@example.com',
      name: 'Jane Smith',
      password: hashedPassword,
      role: 'ATTENDEE',
    },
  })

  console.log('✓ Created 5 users')

  // Create events
  console.log('Creating events...')

  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const event1 = await prisma.event.create({
    data: {
      title: 'Introduction to Next.js 15',
      description: 'Learn the latest features of Next.js 15 including Server Components, Server Actions, and the new App Router. Perfect for beginners and intermediate developers looking to level up their skills.',
      eventDate: nextWeek,
      eventTime: '18:00',
      location: '123 Tech Street, San Francisco, CA',
      capacity: 50,
      category: 'WORKSHOP',
      ticketPrice: 0,
      status: 'PUBLISHED',
      organizerId: organizer1.id,
      imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800',
    },
  })

  const event2 = await prisma.event.create({
    data: {
      title: 'Annual Tech Conference 2025',
      description: 'Join industry leaders for a full day of talks, workshops, and networking. Featuring keynotes from top tech companies and hands-on sessions with cutting-edge technologies.',
      eventDate: nextMonth,
      eventTime: '09:00',
      location: 'Convention Center, 456 Market St, San Francisco, CA',
      capacity: 200,
      category: 'CONFERENCE',
      ticketPrice: 99.99,
      status: 'PUBLISHED',
      organizerId: organizer1.id,
      imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    },
  })

  const event3 = await prisma.event.create({
    data: {
      title: 'React Performance Optimization Workshop',
      description: 'Deep dive into React performance optimization techniques. Learn about memoization, code splitting, lazy loading, and more. Includes hands-on coding exercises.',
      eventDate: tomorrow,
      eventTime: '14:00',
      location: 'Online (Zoom link will be provided)',
      capacity: 30,
      category: 'TRAINING',
      ticketPrice: 49.99,
      status: 'PUBLISHED',
      organizerId: organizer2.id,
      imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
    },
  })

  const event4 = await prisma.event.create({
    data: {
      title: 'TypeScript Best Practices Seminar',
      description: 'Learn TypeScript best practices from experienced developers. Cover topics like type safety, generics, utility types, and common patterns.',
      eventDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      eventTime: '19:00',
      location: 'Tech Hub, 789 Innovation Drive, Palo Alto, CA',
      capacity: 40,
      category: 'SEMINAR',
      ticketPrice: 0,
      status: 'PUBLISHED',
      organizerId: organizer2.id,
      imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
    },
  })

  const event5 = await prisma.event.create({
    data: {
      title: 'Startup Networking Mixer',
      description: 'Connect with fellow entrepreneurs, investors, and tech enthusiasts. Casual atmosphere with drinks and appetizers. Great opportunity to expand your network.',
      eventDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      eventTime: '18:30',
      location: 'The Startup Lounge, 321 Startup Ave, San Francisco, CA',
      capacity: 80,
      category: 'SOCIAL',
      ticketPrice: 25.00,
      status: 'PUBLISHED',
      organizerId: organizer1.id,
      imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800',
    },
  })

  const event6 = await prisma.event.create({
    data: {
      title: 'AI & Machine Learning Summit',
      description: 'Explore the latest developments in AI and machine learning. Sessions on LLMs, computer vision, and practical ML applications. For developers and data scientists.',
      eventDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
      eventTime: '10:00',
      location: 'Innovation Center, 555 AI Boulevard, Mountain View, CA',
      capacity: 150,
      category: 'CONFERENCE',
      ticketPrice: 149.99,
      status: 'PUBLISHED',
      organizerId: organizer1.id,
      imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800',
    },
  })

  const pastEvent = await prisma.event.create({
    data: {
      title: 'Web Development Bootcamp (Past Event)',
      description: 'A comprehensive bootcamp covering HTML, CSS, JavaScript, and modern frameworks.',
      eventDate: lastMonth,
      eventTime: '09:00',
      location: 'Tech Academy, San Francisco, CA',
      capacity: 25,
      category: 'TRAINING',
      ticketPrice: 299.99,
      status: 'PUBLISHED',
      organizerId: organizer2.id,
    },
  })

  console.log('✓ Created 7 events')

  // Create some registrations
  console.log('Creating registrations...')

  await prisma.registration.create({
    data: {
      attendeeId: attendee1.id,
      eventId: event1.id,
      status: 'REGISTERED',
      checkInCode: 'CHK-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      specialRequirements: 'Vegetarian meal preference',
    },
  })

  await prisma.registration.create({
    data: {
      attendeeId: attendee1.id,
      eventId: event3.id,
      status: 'REGISTERED',
      checkInCode: 'CHK-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
    },
  })

  await prisma.registration.create({
    data: {
      attendeeId: attendee2.id,
      eventId: event1.id,
      status: 'REGISTERED',
      checkInCode: 'CHK-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      specialRequirements: 'Gluten-free diet',
    },
  })

  await prisma.registration.create({
    data: {
      attendeeId: attendee1.id,
      eventId: pastEvent.id,
      status: 'ATTENDED',
      checkInCode: 'CHK-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      checkInTime: lastMonth,
    },
  })

  console.log('✓ Created 4 registrations')

  console.log('\n✅ Seed completed successfully!')
  console.log('\n📝 Test accounts created:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('👤 Admin:')
  console.log('   Email: admin@nexvent.com')
  console.log('   Password: password123')
  console.log('\n👤 Organizer 1:')
  console.log('   Email: organizer@nexvent.com')
  console.log('   Password: password123')
  console.log('\n👤 Organizer 2:')
  console.log('   Email: sarah@events.com')
  console.log('   Password: password123')
  console.log('\n👤 Attendee 1 (has registrations):')
  console.log('   Email: john@example.com')
  console.log('   Password: password123')
  console.log('\n👤 Attendee 2:')
  console.log('   Email: jane@example.com')
  console.log('   Password: password123')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })