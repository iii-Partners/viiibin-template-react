import { z } from 'zod/v4'

export const profileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.email('Invalid email address'),
  phone: z.string().nullable().optional(),
})

export type ProfileInput = z.infer<typeof profileSchema>
