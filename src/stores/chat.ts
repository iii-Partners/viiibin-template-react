import { create } from 'zustand'

/**
 * Chat store — AI chat widget UI state.
 *
 * Persistence: none (ephemeral session state)
 * Hydration: 6th (non-blocking, lazy)
 *
 * Message content and history belong in TanStack Query, NOT here.
 * This store only tracks widget open/close state and active conversation.
 */
type ChatState = {
  isOpen: boolean
  activeConversationId: string | null
  setOpen: (open: boolean) => void
  toggle: () => void
  setActiveConversation: (id: string | null) => void
  reset: () => void
}

export const useChatStore = create<ChatState>()((set) => ({
  isOpen: false,
  activeConversationId: null,
  setOpen: (isOpen) => set({ isOpen }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  setActiveConversation: (activeConversationId) => set({ activeConversationId }),
  reset: () => set({ isOpen: false, activeConversationId: null }),
}))
