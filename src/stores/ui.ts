import { create } from 'zustand'

/**
 * UI store — transient interface state.
 *
 * Persistence: none (ephemeral, resets on page reload)
 * Hydration: 5th (non-blocking)
 *
 * Modals, sidebar, and other transient UI state.
 */
type UIState = {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}))
