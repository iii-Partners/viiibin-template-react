export type User = {
  id: string
  email: string
  name: string | null
  picture: string | null
  emailVerified: boolean
}

export type UserProfile = {
  name: string
  email: string
  phone: string | null
  avatarUrl: string | null
}
