import { z } from "zod"
import { UserRole, EventCategory } from "@prisma/client"

export const updateAttendeeSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long").optional(),
  phone: z.string().max(20, "Phone number too long").optional(),
  organization: z.string().max(100, "Organization name too long").optional(),
  bio: z.string().max(500, "Bio too long").optional(),
  interests: z.array(z.nativeEnum(EventCategory)).max(8, "Maximum 8 interests allowed").optional(),
  avatarUrl: z.string().url("Invalid avatar URL").optional(),
})

export const attendeeQuerySchema = z.object({
  page: z.string().optional().default("1").transform((val) => parseInt(val, 10)),
  limit: z.string().optional().default("10").transform((val) => parseInt(val, 10)),
  role: z.nativeEnum(UserRole).optional(),
  organization: z.string().optional(),
  interests: z.string().optional(), // Comma-separated interests
  search: z.string().optional(),
  includePrivate: z.string().optional().transform((val) => val === "true"),
})

export const profilePrivacySchema = z.object({
  showEmail: z.boolean().default(false),
  showPhone: z.boolean().default(false),
  showOrganization: z.boolean().default(true),
  showBio: z.boolean().default(true),
  showInterests: z.boolean().default(true),
  allowSearch: z.boolean().default(true),
})

export type UpdateAttendeeInput = z.infer<typeof updateAttendeeSchema>
export type AttendeeQuery = z.infer<typeof attendeeQuerySchema>
export type ProfilePrivacy = z.infer<typeof profilePrivacySchema>