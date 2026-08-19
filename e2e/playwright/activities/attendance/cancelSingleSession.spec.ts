import { expect, test } from '@playwright/test'

import stubs from '../../../../integration_tests/mockApis/stubs'
import { resetStubs } from '../../../../integration_tests/mockApis/wiremock'
import setupCancelSingleSessionScenario, {
  stubCancelledSingleSession,
} from '../../helpers/activities/attendance/cancelSingleSession'
import { signIn } from '../../helpers/auth'
import verifyPage from '../../helpers/page'

test.beforeEach(async ({ page }) => {
  await resetStubs()
  await stubs.stubSignIn()
  await setupCancelSingleSessionScenario()
  await signIn(page)
})

test('a user can cancel a single paid activity session', async ({ page }) => {
  await page.goto('/activities/attendance')
  await verifyPage(page)

  await page.getByRole('link', { name: 'Record attendance and cancel activity sessions' }).click()
  await verifyPage(page)

  await page.getByRole('radio', { name: 'Select activities from the full list' }).check()
  await page.getByRole('button', { name: 'Continue' }).click()
  await verifyPage(page)

  await page.getByRole('radio', { name: /^Today/ }).check()
  await page.getByRole('checkbox', { name: 'AM (morning)' }).check()
  await page.getByRole('button', { name: 'Continue' }).click()
  await verifyPage(page)

  const englishLevel2Row = page.getByRole('row').filter({ hasText: 'English level 2' })

  await englishLevel2Row.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Mark as cancelled' }).click()
  await verifyPage(page)

  await page.getByRole('radio', { name: 'Location unavailable' }).check()
  await page.getByRole('textbox', { name: 'More details (optional)' }).fill('Location in use')
  await page.getByRole('button', { name: 'Continue' }).click()
  await verifyPage(page)

  await page.getByRole('radio', { name: 'Yes', exact: true }).check()
  await page.getByRole('button', { name: 'Continue' }).click()
  await verifyPage(page)

  const summaryRows = page.locator('.govuk-summary-list__row')

  await expect(summaryRows.filter({ hasText: 'Activity' })).toContainText('English level 2')
  await expect(summaryRows.filter({ hasText: 'Cancellation reason' })).toContainText(
    'Location unavailable - Location in use',
  )
  await expect(summaryRows.filter({ hasText: 'Will people be paid?' })).toContainText('Yes')

  await stubCancelledSingleSession()

  await page.getByRole('button', { name: 'Confirm activity cancellation' }).click()
  await verifyPage(page)

  const cancelledEnglishLevel2Row = page.getByRole('row').filter({ hasText: 'English level 2' })

  await expect(cancelledEnglishLevel2Row).toContainText('Cancelled')
})
