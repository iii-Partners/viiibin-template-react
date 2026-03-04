export const queryKeys = {
  user: {
    all: ['user'] as const,
    me: () => [...queryKeys.user.all, 'me'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
  },
} as const
