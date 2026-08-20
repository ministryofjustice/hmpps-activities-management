import { expect, test } from '@playwright/test'

import verifyPage from './page'

const accessiblePage = `
  <!doctype html>
  <html lang="en">
    <head><title>Test page</title></head>
    <body>
      <main id="main-content"><h1>Test page</h1></main>
    </body>
  </html>
`

test('runs the accessibility check when enabled', async ({ page }) => {
  await page.setContent(accessiblePage)

  await verifyPage(page, true)

  const axeType = await page.evaluate(() => {
    const browser = globalThis as unknown as { axe?: unknown }
    return typeof browser.axe
  })

  expect(axeType).toBe('object')
})

test('skips the accessibility check when disabled', async ({ page }) => {
  await page.setContent(accessiblePage)

  await verifyPage(page, false)

  const axeType = await page.evaluate(() => {
    const browser = globalThis as unknown as { axe?: unknown }
    return typeof browser.axe
  })

  expect(axeType).toBe('undefined')
})
