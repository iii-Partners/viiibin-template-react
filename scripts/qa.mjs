// Visual QA for Northlight OS: screenshots of every view and screen, in both themes, at desktop and phone widths, plus a
// guest action carried through to the operations view, and every design variant on Today. The OS runs on its own
// example data (no API), reset before each pass. Run with the dev server up: `npm run dev`, then `npm run qa` (APP_URL
// overrides the address). Images land in qa-out/.
import { chromium } from '@playwright/test'
import { mkdirSync, readFileSync } from 'node:fs'

const URL = process.env.APP_URL || 'http://localhost:5182'
const OUT = 'qa-out'
mkdirSync(OUT, { recursive: true })
const VARIANTS = JSON.parse(readFileSync('src/design/variants.json', 'utf8')).map((v) => v.id)

async function prime(page, theme, variant = 'northlight') {
  // a script error blanks the page; report it rather than shoot an empty frame
  page.on('pageerror', (e) => console.error(`page error (${theme}/${variant}): ${e.message}`))
  await page.addInitScript(([theme, variant]) => {
    if (sessionStorage.getItem('qa-primed')) return
    sessionStorage.setItem('qa-primed', '1')
    localStorage.setItem('preferences', JSON.stringify({ state: { navStyle: 'rail', stateSwitches: false, notificationsEnabled: true, reducedMotion: false, locale: 'en' }, version: 2 }))
    localStorage.setItem('theme', JSON.stringify({ state: { mode: theme }, version: 0 }))
    localStorage.setItem('variant', JSON.stringify({ state: { id: variant }, version: 2 }))
    localStorage.removeItem('northlight-os')
    sessionStorage.removeItem('screens')
  }, [theme, variant])
}

const settle = (page, ms = 1100) => page.waitForTimeout(ms)
const close = async (page) => { await page.keyboard.press('Escape'); await settle(page, 500) }

const browser = await chromium.launch()
try {
  for (const theme of ['light', 'dark']) {
    for (const [vw, vh, tag] of [[1440, 960, 'desk'], [390, 844, 'phone']]) {
      const ctx = await browser.newContext({ viewport: { width: vw, height: vh } })
      const page = await ctx.newPage()
      const shot = (name) => page.screenshot({ path: `${OUT}/${tag}-${theme}-${name}.png`, fullPage: true })
      await prime(page, theme)
      const view = async (path, name) => { await page.goto(`${URL}${path}`); await settle(page); await shot(name) }

      await view('/app/today', '01-today')
      await view('/app/guests', '02-guests')
      await page.locator('[data-door="guest-g09"]').click()
      await settle(page)
      await shot('03-guest-screen')
      await close(page)
      await view('/app/retreats', '04-retreats')
      await page.locator('[data-door="retreat-A41"]').first().click()
      await settle(page)
      await shot('05-retreat-screen')
      await close(page)
      await view('/app/reviews', '06-reviews')
      await view('/app/care', '07-care')
      await view('/app/portal', '08-portal')
      await view('/app/blueprint', '09-blueprint-flow')
      for (const [word, n] of [['Insights', 10], ['Systems today', 11], ['NL-OS target', 12], ['Discovery', 13]]) {
        await page.getByRole('tab', { name: word }).click()
        await settle(page, 800)
        await shot(`${n}-blueprint-${word.toLowerCase().replace(/[^a-z]+/g, '-')}`)
      }
      await page.getByRole('tab', { name: 'Flow today' }).click()
      await settle(page, 600)
      await page.locator('[data-door="step-M8"]').click()
      await settle(page)
      await shot('14-step-screen')
      await close(page)
      await view('/app/design', '15-design')
      await view('/app/settings', '16-settings')

      // a guest action carried through: Ava pays in the portal, then shows as Preparing with a room
      await page.goto(`${URL}/app/portal`)
      await settle(page)
      // the guest picker is a Select (Radix): open it, shoot the open menu once, then pick Ava
      await page.locator('#as').click()
      await settle(page, 400)
      await shot('17a-portal-select-open')
      await page.getByRole('option', { name: /Ava Lindqvist/ }).click()
      await settle(page, 500)
      await page.getByRole('button', { name: 'Pay now' }).click()
      await settle(page, 700)
      await shot('17-portal-paid')
      await page.goto(`${URL}/app/guests`)
      await settle(page)
      await page.getByRole('radio', { name: /^Preparing/ }).click()
      await settle(page, 600)
      await shot('18-guests-preparing')
      // the clock: two days on, A41 starts and its guests move onto the retreat
      await page.goto(`${URL}/app/today`)
      await settle(page)
      await page.getByRole('button', { name: /Next day/ }).click()
      await page.getByRole('button', { name: /Next day/ }).click()
      await settle(page, 700)
      await shot('19-today-two-days-on')
      await ctx.close()
    }
    // every variant on Today, desktop
    for (const variant of VARIANTS) {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 960 } })
      const page = await ctx.newPage()
      await prime(page, theme, variant)
      await page.goto(`${URL}/app/today`)
      await page.waitForLoadState('networkidle')
      await settle(page, 1400)
      await page.screenshot({ path: `${OUT}/variant-${theme}-${variant}.png`, fullPage: false })
      await ctx.close()
    }
  }
  console.log(`Wrote screenshots to ${OUT}/`)
} finally {
  await browser.close()
}
