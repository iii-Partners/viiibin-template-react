// Example items for a part's Happy path preview: invented, dated relative to today so every reading (this week's
// changes, the 14-day rhythm, the needle) has something to show.
import type { Item } from '@/lib/api/items'

const DAY = 86_400_000
const at = (daysAgo: number) => new Date(Date.now() - daysAgo * DAY).toISOString()

export function sampleItems(): Item[] {
  return [
    { id: 9001, title: 'Supplier contract renewal', description: 'Renews January 1; pricing review due first', status: 'active', created_at: at(26), updated_at: at(1) },
    { id: 9002, title: 'Spring catalog photos', description: 'Waiting on the photographer', status: 'active', created_at: at(23), updated_at: at(3) },
    { id: 9003, title: 'Website accessibility audit', description: 'WCAG 2.1 AA pass on checkout', status: 'done', created_at: at(27), updated_at: at(6) },
    { id: 9004, title: 'Holiday hours notice', description: null, status: 'done', created_at: at(12), updated_at: at(9) },
    { id: 9005, title: 'New hire onboarding pack', description: 'Two hires start in November', status: 'active', created_at: at(8), updated_at: at(0) },
    { id: 9006, title: 'Old price list', description: null, status: 'archived', created_at: at(27), updated_at: at(25) },
  ]
}
