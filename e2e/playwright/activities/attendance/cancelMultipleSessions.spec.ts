import { expect, test } from '@playwright/test'
import { format } from 'date-fns'

import stubs from '../../../../integration_tests/mockApis/stubs'
import { resetStubs } from '../../../../integration_tests/mockApis/wiremock'
import setupCancelMultipleSessionsScenario, {
  stubCancelledSession,
  stubCancelledSessionsSummary,
  stubUncancelledSession,
} from '../../helpers/activities/attendance/cancelMultipleSessions'
import { signIn } from '../../helpers/auth'
import { clickButton, clickLink, expectSummaryRow } from '../../helpers/govuk'
import verifyPage, { expectPage } from '../../helpers/page'

test.beforeEach(async ({ page }) => {
  await resetStubs()
  await stubs.stubSignIn()
  await setupCancelMultipleSessionsScenario()
  await signIn(page)
})

test('a user can cancel multiple sessions, update cancellation details and uncancel one session', async ({ page }) => {
  await page.goto('/activities/attendance')
  await verifyPage(page, true)

  await clickLink(page, 'Record attendance and cancel activity sessions')
  await verifyPage(page, true)

  await page.getByRole('radio', { name: 'Select activities from the full list' }).check()

  await clickButton(page, 'Continue')
  await verifyPage(page, true)

  await page.getByRole('radio', { name: /^Today/ }).check()
  await page.getByRole('checkbox', { name: 'AM (morning)' }).check()
  await page.getByRole('checkbox', { name: 'PM (afternoon)' }).check()
  await page.getByRole('checkbox', { name: 'ED (evening)' }).check()
  await clickButton(page, 'Continue')
  await verifyPage(page, true)

  const englishLevel1Row = page.getByRole('row').filter({ hasText: 'English level 1' })

  const englishLevel2Row = page.getByRole('row').filter({ hasText: 'English level 2' })

  await englishLevel1Row.getByRole('checkbox').check()
  await englishLevel2Row.getByRole('checkbox').check()

  await clickButton(page, 'Mark as cancelled')

  await expectPage(page, 'Why are you cancelling these sessions?', true)

  await page.getByRole('radio', { name: 'Location unavailable' }).check()

  await page.getByRole('textbox', { name: 'More details (optional)' }).fill('Location in use')

  await clickButton(page, 'Continue')
  await verifyPage(page, true)

  await page.getByRole('radio', { name: 'No', exact: true }).check()
  await clickButton(page, 'Continue')
  await verifyPage(page, true)

  await expectSummaryRow(page, "Sessions you're cancelling", '2')
  await expectSummaryRow(page, 'Cancellation reason', 'Location unavailable - Location in use')
  await expectSummaryRow(page, 'Pay for cancelled sessions', 'No')

  await page.getByText("View the sessions you're cancelling").click()

  const cancellationTable = page.locator('[data-qa="cancel-multiple-sessions-list"]')

  await expect(cancellationTable).toContainText(`${format(new Date(), 'EEEE, d MMMM yyyy')} - PM`)

  await expect(cancellationTable).toContainText('Entry level English 4 (PM)')
  await expect(cancellationTable).toContainText('English Level 2 (PM)')

  await stubCancelledSessionsSummary()
  await stubCancelledSession(false)

  await clickButton(page, 'Confirm activity cancellations')
  await verifyPage(page, true)

  const cancelledEnglishRow = page.getByRole('row').filter({ hasText: 'English level 1' })

  await expect(cancelledEnglishRow).toContainText('Cancelled')

  const attendancePagePromise = page.waitForEvent('popup')

  await clickLink(cancelledEnglishRow, /English level 1/)

  const attendancePage = await attendancePagePromise

  await expectPage(attendancePage, 'Session cancelled', true)

  await expect(attendancePage.getByText('Location unavailable - this is a comment')).toBeVisible()

  await clickLink(attendancePage, 'View or edit cancellation')

  await expectPage(attendancePage, 'View or edit cancellation details', true)

  await expectSummaryRow(attendancePage, 'Reason', 'Location unavailable')
  await expectSummaryRow(attendancePage, 'Pay', 'No')
  await expectSummaryRow(attendancePage, 'Cancelled by', 'USER1 - J. Smith')

  await clickLink(attendancePage, 'Change pay')

  await expectPage(attendancePage, 'Change if people should be paid for this cancelled session', true)

  await clickLink(attendancePage, 'Do not change pay for this session')

  await expectPage(attendancePage, 'View or edit cancellation details', true)

  await clickLink(attendancePage, 'Change pay')

  await attendancePage.getByRole('radio', { name: 'Yes' }).check()

  await stubCancelledSession(true)

  await clickButton(attendancePage, 'Update pay for this cancelled session')

  await verifyPage(attendancePage, true)

  await expect(attendancePage.getByText("You've updated the pay for this session")).toBeVisible()

  await expectSummaryRow(attendancePage, 'Pay', 'Yes')

  await attendancePage.getByRole('link', { name: 'Back', exact: true }).click()
  await verifyPage(attendancePage, true)

  await attendancePage
    .getByRole('link', { name: /^uncancel this session$/i })
    .first()
    .click()

  await expectPage(attendancePage, 'Are you sure you want to uncancel this session?', true)

  await attendancePage.getByRole('radio', { name: 'Yes' }).check()

  await stubUncancelledSession()

  await clickButton(attendancePage, 'Confirm')
  await verifyPage(attendancePage, true)

  await expect(attendancePage.getByText('Session no longer cancelled')).toBeVisible()

  await expect(attendancePage.getByRole('heading', { name: 'Session cancelled' })).toHaveCount(0)
})
