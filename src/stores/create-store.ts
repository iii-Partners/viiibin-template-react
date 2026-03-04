/**
 * Store creation conventions and architecture documentation.
 *
 * NAMING:
 * - Hook: use{Name}Store (e.g., useThemeStore)
 * - File: {name}.ts (kebab-case)
 * - Actions: imperative verbs (setMode, toggle, reset)
 * - State: descriptive nouns (mode, isOpen, currentStep)
 * - Selectors: inline — useThemeStore(s => s.mode)
 *
 * PERSISTENCE:
 * - localStorage: survives browser close (theme, preferences, onboarding)
 * - sessionStorage: cleared on tab close (auth state cache)
 * - none: ephemeral, resets on reload (ui, chat)
 *
 * HYDRATION ORDER (controlled by provider mounting):
 * 1. themeStore — apply before first paint (inline in theme.ts import)
 * 2. authStore — resolve before protected route rendering
 * 3. preferencesStore — user settings, non-blocking
 * 4. onboardingStore — first-run state, non-blocking
 * 5. uiStore — ephemeral, never persisted
 * 6. chatStore — ephemeral session state, never persisted
 *
 * SEPARATION RULE:
 * - Zustand: UI state only (theme, sidebar, modals, onboarding progress)
 * - TanStack Query: server state only (user profile, API data, messages)
 * - NEVER put API data in Zustand. NEVER put UI state in TanStack Query.
 */

export const STORE_CONVENTIONS = {
  naming: {
    hook: 'use{Name}Store',
    file: '{name}.ts',
    actions: 'imperative verbs: set*, toggle*, reset',
    state: 'descriptive nouns: mode, isOpen, currentStep',
  },
  hydrationOrder: ['theme', 'auth', 'preferences', 'onboarding', 'ui', 'chat'],
} as const
