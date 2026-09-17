import { Page } from '@playwright/test'

export default async function handleSameDayModification(page: Page) {
  const headingText = await page.getByRole('heading', { level: 1 }).textContent()

  if (/^Do you want the .+ (AM|PM) session to run today\?$/.test(headingText?.trim() ?? '')) {
    await page.getByRole('radio', { name: 'Yes' }).check()
    await page.getByRole('button', { name: 'Continue' }).click()
  }
}
