import { expect, test } from '@playwright/test'

import stubs from '../../../../integration_tests/mockApis/stubs'
import { resetStubs } from '../../../../integration_tests/mockApis/wiremock'
import setupCancelSingleSessionScenario, {
  stubCancelledSingleSession,
} from '../../helpers/activities/attendance/cancelSingleSession'
import { signIn } from '../../helpers/auth'
import { clickButton, clickLink, expectSummaryRow } from '../../helpers/govuk'
import verifyPage from '../../helpers/page'

test.beforeEach(async ({ page }) => {
  await resetStubs()
  await stubs.stubSignIn()
  await setupCancelSingleSessionScenario()
  await signIn(page)
})

test('a user can cancel a single paid activity session', async ({ page }) => {
  await page.goto('/activities/attendance')
  await verifyPage(page, true)

  await clickLink(page, 'Record attendance and cancel activity sessions')
  await verifyPage(page, true)

  await page.getByRole('radio', { name: 'Select activities from the full list' }).check()
  await clickButton(page, 'Continue')
  await verifyPage(page, true)

  await page.getByRole('radio', { name: /^Today/ }).check()
  await page.getByRole('checkbox', { name: 'AM (morning)' }).check()
  await clickButton(page, 'Continue')
  await verifyPage(page, true)

  const englishLevel2Row = page.getByRole('row').filter({ hasText: 'English level 2' })

  await englishLevel2Row.getByRole('checkbox').check()
  await clickButton(page, 'Mark as cancelled')
  await verifyPage(page, true)

  await page.getByRole('radio', { name: 'Location unavailable' }).check()
  await page.getByRole('textbox', { name: 'More details (optional)' }).fill('Location in use')
  await clickButton(page, 'Continue')
  await verifyPage(page, true)

  await page.getByRole('radio', { name: 'Yes', exact: true }).check()
  await clickButton(page, 'Continue')
  await verifyPage(page, true)

  await expectSummaryRow(page, 'Activity', 'English level 2')
  await expectSummaryRow(page, 'Cancellation reason', 'Location unavailable - Location in use')
  await expectSummaryRow(page, 'Will people be paid?', 'Yes')

  await stubCancelledSingleSession()

  await clickButton(page, 'Confirm activity cancellation')
  await verifyPage(page, true)

  const cancelledEnglishLevel2Row = page.getByRole('row').filter({ hasText: 'English level 2' })

  await expect(cancelledEnglishLevel2Row).toContainText('Cancelled')
})
