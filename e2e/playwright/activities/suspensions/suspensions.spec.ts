import { expect, test } from '@playwright/test'

import stubs from '../../../../integration_tests/mockApis/stubs'
import { resetStubs } from '../../../../integration_tests/mockApis/wiremock'
import setupSingleSuspensionScenario, {
  stubBulkActiveAllocations,
  stubBulkSuspendedAllocations,
  stubSuspendedOutsideAllocation,
} from '../../helpers/activities/suspensions/suspensions'
import { signInEAEnabled } from '../../helpers/auth'
import { clickButton, clickLink, expectHeading, expectSummaryRow } from '../../helpers/govuk'

test.beforeEach(async ({ page }) => {
  await resetStubs()
  await stubs.stubSignIn()
  await setupSingleSuspensionScenario()
  await signInEAEnabled(page)
})

test('a user can suspend and end a suspension for an outside activity', async ({ page }) => {
  await page.goto('/activities/suspensions/prisoner/G0995GW')

  await expectHeading(page, "Alfonso Cholak's activities")

  const hotelRow = page.getByRole('row').filter({ hasText: 'Hotel' })

  await clickLink(hotelRow, /Suspend from activity/)

  await expectHeading(page, "When does Alfonso Cholak's suspension from Hotel start?")

  await page.getByRole('radio', { name: 'Immediately' }).check()

  await clickButton(page, 'Continue')

  await expectHeading(page, 'Should Alfonso Cholak be paid for Hotel while they’re suspended?')

  await page.getByRole('radio', { name: 'Yes' }).check()

  await clickButton(page, 'Continue')

  await expectHeading(page, 'Do you want to add a case note about why Alfonso Cholak is being suspended?')

  await page.getByRole('radio', { name: 'No' }).check()

  await clickButton(page, 'Continue')

  await expectHeading(page, 'Check and confirm suspension details')

  await expectSummaryRow(page, 'Activity', 'Hotel')

  await expectSummaryRow(page, 'First day of suspension', 'Today - suspension starts immediately')

  await expectSummaryRow(page, 'Paid while suspended?', 'Yes')

  await expectSummaryRow(page, 'Do you want to add a case note?', 'No')

  await clickButton(page, 'Confirm and suspend')

  await expectHeading(page, 'Suspension started')

  await expect(page.locator('.govuk-panel__body')).toContainText('Alfonso Cholak (G0995GW) is now suspended from Hotel')

  await expect(
    page.getByText(/Temporary absences for Alfonso Cholak to go out to this activity should be cancelled/),
  ).toBeVisible()

  // Allocation changed so update the prisoner-allocation response before returning to Manage suspensions.
  await stubSuspendedOutsideAllocation()

  await clickLink(page, "manage Alfonso Cholak's suspensions")

  await expectHeading(page, "Alfonso Cholak's activities")

  const suspendedHotelRow = page.getByRole('row').filter({ hasText: 'Hotel' })

  await clickLink(suspendedHotelRow, /View or end suspension/)

  await expectHeading(page, 'Suspension details')

  await expectSummaryRow(page, 'Activity', 'Hotel')

  await expectSummaryRow(page, 'Paid while suspended?', 'Yes')

  await clickButton(page, 'End suspension')

  await expectHeading(page, "When should Alfonso Cholak's suspension from Hotel end?")

  await page.getByRole('radio', { name: 'Immediately' }).check()

  await clickButton(page, 'Continue')

  await expectHeading(page, 'Check and confirm end of suspension details')

  await expectSummaryRow(page, 'Activity', 'Hotel')

  await expectSummaryRow(page, 'Last day of suspension', 'Immediately')

  await clickButton(page, 'Confirm end of suspension')

  await expectHeading(page, 'Suspension ended')

  await expect(page.locator('.govuk-panel__body')).toContainText(
    'Alfonso Cholak (G0995GW) is no longer suspended from Hotel',
  )
})

test('a user can suspend and end suspensions for all activities', async ({ page }) => {
  await stubBulkActiveAllocations()

  await page.goto('/activities/suspensions/prisoner/G0995GW')

  await expectHeading(page, "Alfonso Cholak's activities")

  await clickButton(page, 'Suspend from all activities')

  await expectHeading(page, "When does Alfonso Cholak's suspension start?")

  await page.getByRole('radio', { name: 'Immediately' }).check()

  await clickButton(page, 'Continue')

  await expectHeading(page, /Should Alfonso Cholak be paid .*while they’re suspended\?/)

  await expect(page.locator('#paid-hint')).toContainText(
    'Alfonso Cholak is currently paid for 1 of 2 activities you’re suspending them from:',
  )

  await expect(page.locator('#paid-hint')).toContainText('Activity 1')

  await page.getByRole('radio', { name: 'Yes' }).check()

  await clickButton(page, 'Continue')

  await expectHeading(page, 'Do you want to add a case note about why Alfonso Cholak is being suspended?')

  await page.getByRole('radio', { name: 'No' }).check()

  await clickButton(page, 'Continue')

  await expectHeading(page, 'Check and confirm suspension details')

  await expectSummaryRow(page, 'Activity', /Activity 1[\s\S]*Activity 2/)

  await expectSummaryRow(page, 'First day of suspension', 'Today - suspension starts immediately')

  await expectSummaryRow(page, 'Paid while suspended?', /Yes, for:[\s\S]*Activity 1/)

  await expectSummaryRow(page, 'Do you want to add a case note?', 'No')

  await clickButton(page, 'Confirm and suspend')

  await expectHeading(page, 'Suspension started')

  await expect(page.locator('.govuk-panel__body')).toContainText('Alfonso Cholak (G0995GW) is now suspended from')

  await expect(page.locator('.govuk-panel__body')).toContainText('2 activities')

  await stubBulkSuspendedAllocations()

  await clickLink(page, "manage Alfonso Cholak's suspensions")

  await expectHeading(page, "Alfonso Cholak's activities")

  await clickButton(page, 'End all suspensions')

  await expectHeading(page, 'Suspension details')

  await expect(page.getByText('Activity 1', { exact: true })).toBeVisible()

  await expect(page.getByText('Activity 2', { exact: true })).toBeVisible()

  await clickButton(page, 'End all suspensions')

  await expectHeading(page, "When should Alfonso Cholak's suspension from 2 activities end?")

  await page.getByRole('radio', { name: 'Immediately' }).check()

  await clickButton(page, 'Continue')

  await expectHeading(page, 'Check and confirm end of suspension details')

  await expectSummaryRow(page, 'Activity', /Activity 1[\s\S]*Activity 2/)

  await expectSummaryRow(page, 'Last day of suspension', 'Immediately')

  await clickButton(page, 'Confirm end of suspension')

  await expectHeading(page, 'Suspension ended')

  await expect(page.locator('.govuk-panel__body')).toContainText('Alfonso Cholak (G0995GW) is no longer suspended from')

  await expect(page.locator('.govuk-panel__body')).toContainText('2 activities')
})
