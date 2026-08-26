import { Page } from '@playwright/test'
import { clickButton } from './govuk'

const handleSameDayModification = async (page: Page): Promise<void> => {
  const heading = page.getByRole('heading')

  const headingText = await heading.textContent()

  if (/^Do you want the .+ (AM|PM) session to run today\?$/.test(headingText?.trim() ?? '')) {
    await page.getByRole('radio', { name: 'Yes' }).check()
    await clickButton(page, 'Continue')
  }
}

export default handleSameDayModification
