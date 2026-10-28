// The getting-started steps: what a new account does first. Until each is done it waits under Needs you on the
// dashboard, with the door that does it. The first-item step reads the items themselves; the others are marked done by
// the screens that do them.
import type { ScreenId } from '@/stores/screens'

export type Step = {
  id: string
  title: string
  why: string
  /** what the step changes once done */
  facts: [string, string][]
  /** a screen that does it, or the main view that does */
  screen?: ScreenId
  path?: string
  action: string
}

export const STEPS: Step[] = [
  {
    id: 'first-item',
    title: 'Add your first item',
    why: 'Items are the records this app keeps. The dashboard counts them by state, and each opens to its own screen with its history.',
    facts: [['Where', 'Items'], ['Takes', 'Under a minute'], ['Fills', 'The dashboard’s counts']],
    path: '/app/items',
    action: 'Go to Items',
  },
  {
    id: 'profile',
    title: 'Complete your profile',
    why: 'Your name and email tell the app who you are. Messages the app sends you go to that email.',
    facts: [['Where', 'Profile'], ['Takes', 'A minute'], ['Asks for', 'Name, email, phone (optional)']],
    screen: 'profile',
    action: 'Open profile',
  },
  {
    id: 'preferences',
    title: 'Set your preferences',
    why: 'Choose light or dark, and review what this app may record about you.',
    facts: [['Where', 'Settings'], ['Takes', 'A minute'], ['Asks for', 'A theme and your privacy choices']],
    screen: 'settings',
    action: 'Open settings',
  },
]
