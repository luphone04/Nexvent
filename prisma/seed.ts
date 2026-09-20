import { randomBytes } from 'node:crypto'
import { PrismaClient, EventCategory, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Idempotent: only insert missing demo records; never erase visitors' data.
  const password = await bcrypt.hash('NexventDemo2026!', 12)
  const people = [
    { id: 'demo-organizer', email: 'organizer@nexvent.example', name: 'Alex Morgan', role: UserRole.ORGANIZER },
    { id: 'demo-community', email: 'community@nexvent.example', name: 'Sam Rivera', role: UserRole.ORGANIZER },
    { id: 'demo-attendee', email: 'attendee@nexvent.example', name: 'Jamie Chen', role: UserRole.ATTENDEE },
    { id: 'demo-attendee-2', email: 'taylor@nexvent.example', name: 'Taylor Park', role: UserRole.ATTENDEE },
  ]
  for (const person of people) {
    await prisma.user.upsert({ where: { id: person.id }, update: {}, create: { ...person, password, interests: [], organization: 'Nexvent Demo Community' } })
  }
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    if (process.env.ADMIN_PASSWORD.length < 16) throw new Error('Use an admin password of at least 16 characters')
    await prisma.user.upsert({
      where: { email: process.env.ADMIN_EMAIL.toLowerCase() }, update: {},
      create: { email: process.env.ADMIN_EMAIL.toLowerCase(), name: 'Portfolio Owner', role: 'ADMIN', password: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12), interests: [] },
    })
  }
  const events: Array<{ title: string; category: EventCategory; days: number; capacity: number; location: string }> = [
    { title: 'Community Check-in Showcase', category: 'MEETUP', days: 0, capacity: 30, location: 'Bangkok Demo Studio' },
    { title: 'Build Your First Next.js App', category: 'WORKSHOP', days: 7, capacity: 40, location: 'Bangkok Innovation Hub' },
    { title: 'Designing Accessible Experiences', category: 'SEMINAR', days: 14, capacity: 60, location: 'Creative Commons, Bangkok' },
    { title: 'Developer Community Night', category: 'SOCIAL', days: 21, capacity: 80, location: 'Riverside Community Space' },
    { title: 'Small Group TypeScript Lab', category: 'TRAINING', days: 10, capacity: 1, location: 'Online Demo Classroom' },
    { title: 'Open Source Weekend', category: 'CONFERENCE', days: 30, capacity: 120, location: 'Bangkok Technology Center' },
    { title: 'Community Fun Run', category: 'SPORTS', days: 45, capacity: 100, location: 'Demo City Park' },
    { title: 'Acoustic Community Evening', category: 'CONCERT', days: 60, capacity: 75, location: 'Riverside Demo Stage' },
    { title: 'Previous Portfolio Meetup', category: 'MEETUP', days: -14, capacity: 30, location: 'Bangkok Demo Studio' },
  ]
  const images = ['https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800', 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800', 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800', 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800']
  for (const [index, item] of events.entries()) {
    const eventDate = new Date(Date.now() + item.days * 86400000 + 2 * 3600000)
    await prisma.event.upsert({ where: { id: `demo-event-${index}` }, update: {}, create: {
      id: `demo-event-${index}`, title: item.title, category: item.category, capacity: item.capacity, location: item.location,
      description: `${item.title} is a fictional portfolio event demonstrating event discovery, registration, waitlists, and QR check-in. Explore the attendee and organizer workflows with sample data. No real event, payment, or email delivery is involved.`,
      imageUrl: images[index % images.length], eventDate, eventTime: eventDate.toISOString().slice(11, 16), ticketPrice: 0,
      status: item.days < 0 ? 'COMPLETED' : 'PUBLISHED', organizerId: index % 2 ? 'demo-community' : 'demo-organizer',
    } })
    await prisma.event.updateMany({ where: { id: `demo-event-${index}`, imageUrl: null }, data: { imageUrl: images[index % images.length] } })
  }
  for (const item of [
    { eventId: 'demo-event-0', attendeeId: 'demo-attendee', status: 'REGISTERED' as const },
    { eventId: 'demo-event-4', attendeeId: 'demo-attendee-2', status: 'REGISTERED' as const },
    { eventId: 'demo-event-4', attendeeId: 'demo-attendee', status: 'WAITLISTED' as const },
    { eventId: 'demo-event-8', attendeeId: 'demo-attendee', status: 'ATTENDED' as const },
  ]) {
    await prisma.registration.upsert({
      where: { eventId_attendeeId: { eventId: item.eventId, attendeeId: item.attendeeId } }, update: {},
      create: { ...item, checkInCode: randomBytes(8).toString('hex').toUpperCase(), waitlistPosition: item.status === 'WAITLISTED' ? 1 : null, checkInTime: item.status === 'ATTENDED' ? new Date(Date.now() - 14 * 86400000) : null },
    })
  }
  console.log('Demo records ready. Existing records were preserved.')
}
main().catch(error => { console.error(error); process.exitCode = 1 }).finally(() => prisma.$disconnect())
