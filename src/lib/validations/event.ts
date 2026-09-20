import { z } from "zod"
import { EventCategory, EventStatus } from "@prisma/client"

const eventFields = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().optional(),
  eventDate: z.string().datetime("Invalid date format"),
  eventTime: z.string().optional(),
  location: z.string().min(1, "Location is required").max(200, "Location too long"),
  capacity: z.number().int().min(1, "Capacity must be at least 1"),
  category: z.nativeEnum(EventCategory, { message: "Invalid category" }),
  ticketPrice: z.number().min(0).max(0, "Portfolio events are free; payments are not enabled"),
  imageUrl: z.string().url("Invalid image URL").optional(),
  status: z.nativeEnum(EventStatus, { message: "Invalid status" }),
})

export const createEventSchema = eventFields.extend({
  ticketPrice: eventFields.shape.ticketPrice.default(0),
  status: eventFields.shape.status.default(EventStatus.DRAFT),
})
export const updateEventSchema = eventFields.partial()

export const eventQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  category: z.nativeEnum(EventCategory).optional(),
  location: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  priceMin: z.string().optional().transform((val) => val ? parseFloat(val) : undefined),
  priceMax: z.string().optional().transform((val) => val ? parseFloat(val) : undefined),
  organizerId: z.string().optional(),
  status: z.nativeEnum(EventStatus).optional(),
  search: z.string().optional(),
})

export type CreateEventInput = z.infer<typeof createEventSchema>
export type UpdateEventInput = z.infer<typeof updateEventSchema>
export type EventQuery = z.infer<typeof eventQuerySchema>