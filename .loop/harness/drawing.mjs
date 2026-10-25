import { chromium } from '@playwright/test'
import assert from 'node:assert/strict'
import { readFileSync, mkdirSync } from 'node:fs'

const svg = readFileSync('docs/business-os/control-surface.svg', 'utf8')
assert(svg.includes('<svg'))
assert(svg.includes('<title'))
const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 980 } })
  await page.setContent(svg)
  for (const text of ['Discovery', 'Business OS', 'EYE', 'Unmeasured', 'GOVENANT']) {
    await page.getByText(text, { exact: false }).first().waitFor({ state: 'visible' })
  }
  mkdirSync('.loop/artifacts/screenshots/os-drawing', { recursive: true })
  await page.screenshot({ path: '.loop/artifacts/screenshots/os-drawing/control-surface.png', fullPage: true })
  console.log('PASS: SVG rendered; EYE-only admin boundary and unmeasured state visible')
} finally { await browser.close() }
