/**
 * Zustand Store Architecture
 *
 * STORES & PERSISTENCE:
 * ┌──────────────────────┬─────────────────┬──────────────────────────────┐
 * │ Store                │ Persistence     │ Purpose                      │
 * ├──────────────────────┼─────────────────┼──────────────────────────────┤
 * │ useThemeStore        │ localStorage    │ Dark/light/system mode       │
 * │ useAuthStore         │ sessionStorage  │ Auth0 state mirror           │
 * │ usePreferencesStore  │ localStorage    │ User-configurable settings   │
 * │ useOnboardingStore   │ localStorage    │ First-run experience state   │
 * │ useUIStore           │ none            │ Sidebar, modals              │
 * │ useChatStore         │ none            │ Chat widget open/close       │
 * └──────────────────────┴─────────────────┴──────────────────────────────┘
 *
 * HYDRATION ORDER (controlled by provider mounting):
 * 1. themeStore — apply before first paint (inline script in index.html)
 * 2. authStore — resolve before protected route rendering
 * 3. preferencesStore — non-blocking user settings
 * 4. onboardingStore — non-blocking first-run state
 * 5. uiStore — ephemeral, never persisted
 * 6. chatStore — ephemeral, never persisted
 *
 * SEPARATION RULE:
 * - Zustand → UI state ONLY (theme, sidebar, modals, onboarding)
 * - TanStack Query → server state ONLY (user profile, API data, messages)
 * - NEVER put API responses in Zustand
 * - NEVER put UI toggles in TanStack Query
 *
 * NAMING CONVENTIONS:
 * - Hook: use{Name}Store
 * - File: {name}.ts (kebab-case)
 * - Actions: imperative verbs (setMode, toggle, reset)
 * - State: descriptive nouns (mode, isOpen, currentStep)
 * - Selectors: inline in components — useThemeStore(s => s.mode)
 */

export { STORE_CONVENTIONS } from './create-store'
export { useThemeStore } from './theme'
export { useAuthStore } from './auth'
export { usePreferencesStore } from './preferences'
export { useOnboardingStore } from './onboarding'
export { useUIStore } from './ui'
export { useChatStore } from './chat'
