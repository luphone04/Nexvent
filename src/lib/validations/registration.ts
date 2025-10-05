import { z } from "zod"
import { RegistrationStatus } from "@prisma/client"

export const createRegistrationSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  notes: z.string().max(500, "Notes too long").optional(),
  specialRequirements: z.string().max(500).optional(),
  dietaryRestrictions: z.string().max(200).optional(),
  emergencyContact: z.string().max(100).optional(),
  emergencyPhone: z.string().max(20).optional(),
})

export const updateRegistrationSchema = z.object({
  notes: z.string().max(500, "Notes too long").optional(),
  status: z.nativeEnum(RegistrationStatus).optional(),
})

export const registrationQuerySchema = z.object({
  page: z.string().optional().default("1").transform((val) => parseInt(val, 10)),
  limit: z.string().optional().default("10").transform((val) => parseInt(val, 10)),
  status: z.nativeEnum(RegistrationStatus).optional(),
  eventId: z.string().optional(),
  userId: z.string().optional(),
  fromDate: z.string().optional(), // ISO date string
  toDate: z.string().optional(),   // ISO date string
  includeExpired: z.string().optional().transform((val) => val === "true"),
})

export const checkInSchema = z.object({
  code: z.string().min(1, "Check-in code is required"),
})

export const bulkRegistrationSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  userIds: z.array(z.string().min(1)).min(1, "At least one user ID required").max(50, "Maximum 50 users per bulk registration"),
  notes: z.string().max(500, "Notes too long").optional(),
})

export type CreateRegistrationInput = z.infer<typeof createRegistrationSchema>
export type UpdateRegistrationInput = z.infer<typeof updateRegistrationSchema>
export type RegistrationQuery = z.infer<typeof registrationQuerySchema>
export type CheckInInput = z.infer<typeof checkInSchema>
export type BulkRegistrationInput = z.infer<typeof bulkRegistrationSchema>