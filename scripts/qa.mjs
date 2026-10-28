// Visual QA: screenshots of every main view and screen in each data state (fresh, partial, failed), in both themes,
// at desktop and phone widths, into qa-out/. The items API is answered from fixtures, so no database is needed. Run
// with the dev server up: `npm run dev`, then `npm run qa` (APP_URL overrides the address).
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const URL = process.env.APP_URL || 'http://localhost:5182'
const OUT = 'qa-out'
mkdirSync(OUT, { recursive: true })

const day = (d) => `2026-10-${String(d).padStart(2, '0')} 09:00:00`
const ITEMS = [
  { id: 1, title: 'Supplier contract renewal', description: 'Renews January 1; pricing review due first', status: 'active', created_at: day(2), updated_at: day(27) },
  { id: 2, title: 'Spring catalog photos', description: null, status: 'active', created_at: day(5), updated_at: day(21) },
  { id: 3, title: 'Website accessibility audit', description: 'WCAG 2.1 AA pass on checkout', status: 'done', created_at: day(1), updated_at: day(19) },
  { id: 4, title: 'Old price list', description: null, status: 'archived', created_at: day(1), updated_at: day(3) },
]
const DATA = { fresh: [], partial: ITEMS }

async function stage(page, state) {
  // only the API's own path: a glob would also catch the source module /src/lib/api/items.ts
  await page.route((url) => url.pathname.startsWith('/api/items'), (route) => {
    if (state === 'failed') return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Unavailable' }) })
    const items = DATA[state]
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ items, total: items.length, limit: 50, offset: 0 }) })
  })
}

async function fresh(page, theme, steps = [], nav = 'wedges', switches = false) {
  // a script error blanks the page; report it rather than shoot an empty frame
  page.on('pageerror', (e) => console.error(`page error (${theme}): ${e.message}`))
  await page.addInitScript(([theme, steps, nav, switches]) => {
    localStorage.setItem('preferences', JSON.stringify({ state: { navStyle: nav, stateSwitches: switches, notificationsEnabled: true, reducedMotion: false, locale: 'en' }, version: 0 }))
    localStorage.setItem('theme', JSON.stringify({ state: { mode: theme }, version: 0 }))
    localStorage.setItem('onboarding', JSON.stringify({ state: { completed: false, currentStep: 0, completedSteps: steps }, version: 0 }))
    sessionStorage.clear()
  }, [theme, steps, nav, switches])
}

const settle = (page, ms = 900) => page.waitForTimeout(ms)

const browser = await chromium.launch()
try {
  for (const theme of ['light', 'dark']) {
    for (const [vw, vh, tag] of [[1440, 960, 'desk'], [390, 844, 'phone']]) {
      const shot = async (page, name) => page.screenshot({ path: `${OUT}/${tag}-${theme}-${name}.png`, fullPage: true })
      // a fresh account: no items, no steps done
      {
        const ctx = await browser.newContext({ viewport: { width: vw, height: vh } })
        const page = await ctx.newPage()
        await fresh(page, theme)
        await stage(page, 'fresh')
        await page.goto(`${URL}/app/dashboard`)
        await settle(page)
        await shot(page, '01-dashboard-fresh')
        await page.goto(`${URL}/app/items`)
        await settle(page)
        await shot(page, '02-items-fresh')
        await page.locator('[data-door="dial-tool"]').click()
        await settle(page, 1200)
        await shot(page, '12-dial-fresh')
        await ctx.close()
      }
      // a partial account: four items, one step done
      {
        const ctx = await browser.newContext({ viewport: { width: vw, height: vh } })
        const page = await ctx.newPage()
        await fresh(page, theme, ['preferences'])
        await stage(page, 'partial')
        await page.goto(`${URL}/app/dashboard`)
        await settle(page)
        await shot(page, '03-dashboard-partial')
        // a need's context grown over the set
        await page.getByRole('button', { name: /^Context/ }).first().click()
        await settle(page, 700)
        await shot(page, '04-dashboard-context')
        await page.keyboard.press('Escape')
        await settle(page, 700)
        await page.goto(`${URL}/app/items`)
        await settle(page)
        await shot(page, '05-items-partial')
        // an item's screen grown from its row, then a confirm over it
        await page.getByRole('button', { name: /Supplier contract renewal/ }).click()
        await settle(page)
        await shot(page, '06-item-screen')
        await page.getByRole('button', { name: 'Delete item' }).click()
        await settle(page, 500)
        await shot(page, '07-item-confirm')
        await page.keyboard.press('Escape')
        await page.keyboard.press('Escape')
        await settle(page, 800)
        await page.goto(`${URL}/app/dashboard`)
        await settle(page)
        await page.locator('[data-door="dial"]').click()
        await settle(page, 1200)
        await shot(page, '13-dial-partial')
        await page.getByText('Activity', { exact: true }).hover()
        await settle(page, 400)
        await shot(page, '14-dial-hover')
        await page.keyboard.press('Escape')
        await settle(page, 800)
        await page.locator('[data-door="design"]').click()
        await settle(page, 1200)
        await shot(page, '08-design-screen')
        // every part in each of the other states, from the switch at the top
        for (const [word, n] of [['Empty', '08b'], ['Loading', '08c'], ['Error', '08d']]) {
          await page.getByRole('radiogroup', { name: 'Every part: state' }).getByRole('radio', { name: word }).click()
          await settle(page, 600)
          await shot(page, `${n}-design-${word.toLowerCase()}`)
        }
        await page.keyboard.press('Escape')
        await settle(page, 800)
        await page.locator('[data-door="profile"]').first().click()
        await settle(page)
        await shot(page, '09-profile-screen')
        await page.keyboard.press('Escape')
        await settle(page, 800)
        await page.locator('[data-door="settings"]').first().click()
        await settle(page)
        await shot(page, '10-settings-screen')
        await ctx.close()
      }
      // the rail instead of the wedge bar
      {
        const ctx = await browser.newContext({ viewport: { width: vw, height: vh } })
        const page = await ctx.newPage()
        await fresh(page, theme, ['preferences'], 'rail')
        await stage(page, 'partial')
        await page.goto(`${URL}/app/dashboard`)
        await settle(page)
        await page.locator('.rail-btn').nth(1).hover()
        await settle(page, 400)
        await shot(page, '15-rail-dashboard')
        await page.locator('[data-door="rail-dial"]').click()
        await settle(page, 1200)
        await shot(page, '16-rail-dial')
        await ctx.close()
      }
      // the state switches: the prototype opens on the Happy path; each view's switch moves it through its states
      {
        const ctx = await browser.newContext({ viewport: { width: vw, height: vh } })
        const page = await ctx.newPage()
        await fresh(page, theme, [], 'wedges', true)
        await stage(page, 'fresh')
        await page.goto(`${URL}/app/dashboard`)
        await settle(page)
        await shot(page, '17-switch-happy')
        for (const word of ['Error', 'Loading']) {
          await page.getByRole('radiogroup', { name: 'Dashboard: preview a state' }).getByRole('radio', { name: word }).click()
          await settle(page, 600)
          await shot(page, `17-switch-${word.toLowerCase()}`)
        }
        await page.locator('[data-door="dial-tool"]').click()
        await settle(page, 1000)
        await page.getByRole('radiogroup', { name: 'Bird’s-eye view: preview a state' }).getByRole('radio', { name: 'Error' }).click()
        await settle(page, 800)
        await shot(page, '18-dial-error')
        await ctx.close()
      }
      // the API down
      {
        const ctx = await browser.newContext({ viewport: { width: vw, height: vh } })
        const page = await ctx.newPage()
        await fresh(page, theme)
        await stage(page, 'failed')
        await page.goto(`${URL}/app/dashboard`)
        await settle(page, 2500)
        await shot(page, '11-dashboard-failed')
        await ctx.close()
      }
    }
  }
  console.log(`Wrote screenshots to ${OUT}/`)
} finally {
  await browser.close()
}
