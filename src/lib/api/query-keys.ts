export const queryKeys = {
  user: {
    all: ['user'] as const,
    me: () => [...queryKeys.user.all, 'me'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
  },
  items: {
    all: ['items'] as const,
    list: (params?: { limit?: number; offset?: number }) =>
      [...queryKeys.items.all, 'list', params] as const,
    detail: (id: number) => [...queryKeys.items.all, 'detail', id] as const,
  },
} as const
