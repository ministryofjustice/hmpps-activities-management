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
import verifyPage from '../../helpers/page'

test.beforeEach(async ({ page }) => {
  await resetStubs()
  await stubs.stubSignIn()
  await setupCancelMultipleSessionsScenario()
  await signIn(page)
})

test('a user can cancel multiple sessions, update cancellation details and uncancel one session', async ({ page }) => {
  await page.goto('/activities/attendance')
  await verifyPage(page)

  await page.getByRole('link', { name: 'Record attendance and cancel activity sessions' }).click()
  await verifyPage(page)

  await page.getByRole('radio', { name: 'Select activities from the full list' }).check()

  await page.getByRole('button', { name: 'Continue' }).click()
  await verifyPage(page)

  await page.getByRole('radio', { name: /^Today/ }).check()
  await page.getByRole('checkbox', { name: 'AM (morning)' }).check()
  await page.getByRole('checkbox', { name: 'PM (afternoon)' }).check()
  await page.getByRole('checkbox', { name: 'ED (evening)' }).check()
  await page.getByRole('button', { name: 'Continue' }).click()
  await verifyPage(page)

  const englishLevel1Row = page.getByRole('row').filter({ hasText: 'English level 1' })

  const englishLevel2Row = page.getByRole('row').filter({ hasText: 'English level 2' })

  await englishLevel1Row.getByRole('checkbox').check()
  await englishLevel2Row.getByRole('checkbox').check()

  await page.getByRole('button', { name: 'Mark as cancelled' }).click()

  await expect(page.getByRole('heading', { name: 'Why are you cancelling these sessions?' })).toBeVisible()
  await verifyPage(page)

  await page.getByRole('radio', { name: 'Location unavailable' }).check()

  await page.getByRole('textbox', { name: 'More details (optional)' }).fill('Location in use')

  await page.getByRole('button', { name: 'Continue' }).click()
  await verifyPage(page)

  await page.getByRole('radio', { name: 'No', exact: true }).check()
  await page.getByRole('button', { name: 'Continue' }).click()
  await verifyPage(page)

  const summaryRows = page.locator('.govuk-summary-list__row')

  await expect(summaryRows.filter({ hasText: "Sessions you're cancelling" })).toContainText('2')

  await expect(summaryRows.filter({ hasText: 'Cancellation reason' })).toContainText(
    'Location unavailable - Location in use',
  )

  await expect(summaryRows.filter({ hasText: 'Pay for cancelled sessions' })).toContainText('No')

  await page.getByText("View the sessions you're cancelling").click()

  const cancellationTable = page.locator('[data-qa="cancel-multiple-sessions-list"]')

  await expect(cancellationTable).toContainText(`${format(new Date(), 'EEEE, d MMMM yyyy')} - PM`)

  await expect(cancellationTable).toContainText('Entry level English 4 (PM)')
  await expect(cancellationTable).toContainText('English Level 2 (PM)')

  await stubCancelledSessionsSummary()
  await stubCancelledSession(false)

  await page.getByRole('button', { name: 'Confirm activity cancellations' }).click()
  await verifyPage(page)

  const cancelledEnglishRow = page.getByRole('row').filter({ hasText: 'English level 1' })

  await expect(cancelledEnglishRow).toContainText('Cancelled')

  const attendancePagePromise = page.waitForEvent('popup')

  await cancelledEnglishRow.getByRole('link', { name: /English level 1/ }).click()

  const attendancePage = await attendancePagePromise

  await expect(attendancePage.getByRole('heading', { name: 'Session cancelled' })).toBeVisible()
  await verifyPage(attendancePage)

  await expect(attendancePage.getByText('Location unavailable - this is a comment')).toBeVisible()

  await attendancePage.getByRole('link', { name: 'View or edit cancellation' }).click()

  await expect(
    attendancePage.getByRole('heading', {
      name: 'View or edit cancellation details',
    }),
  ).toBeVisible()
  await verifyPage(attendancePage)

  const cancellationDetails = attendancePage.locator('.govuk-summary-list__row')

  await expect(cancellationDetails.filter({ hasText: 'Reason' })).toContainText('Location unavailable')

  await expect(cancellationDetails.filter({ hasText: 'Pay' })).toContainText('No')

  await expect(cancellationDetails.filter({ hasText: 'Cancelled by' })).toContainText('USER1 - J. Smith')

  await attendancePage.getByRole('link', { name: 'Change pay' }).click()

  await expect(
    attendancePage.getByRole('heading', {
      name: 'Change if people should be paid for this cancelled session',
    }),
  ).toBeVisible()
  await verifyPage(attendancePage)

  await attendancePage.getByRole('link', { name: 'Do not change pay for this session' }).click()

  await expect(
    attendancePage.getByRole('heading', {
      name: 'View or edit cancellation details',
    }),
  ).toBeVisible()
  await verifyPage(attendancePage)

  await attendancePage.getByRole('link', { name: 'Change pay' }).click()

  await attendancePage.getByRole('radio', { name: 'Yes' }).check()

  await stubCancelledSession(true)

  await attendancePage
    .getByRole('button', {
      name: 'Update pay for this cancelled session',
    })
    .click()

  await verifyPage(attendancePage)

  await expect(attendancePage.getByText("You've updated the pay for this session")).toBeVisible()

  await expect(attendancePage.locator('.govuk-summary-list__row').filter({ hasText: 'Pay' })).toContainText('Yes')

  await attendancePage.getByRole('link', { name: 'Back', exact: true }).click()
  await verifyPage(attendancePage)

  await attendancePage
    .getByRole('link', { name: /^uncancel this session$/i })
    .first()
    .click()

  await expect(
    attendancePage.getByRole('heading', {
      name: 'Are you sure you want to uncancel this session?',
    }),
  ).toBeVisible()
  await verifyPage(attendancePage)

  await attendancePage.getByRole('radio', { name: 'Yes' }).check()

  await stubUncancelledSession()

  await attendancePage.getByRole('button', { name: 'Confirm' }).click()
  await verifyPage(attendancePage)

  await expect(attendancePage.getByText('Session no longer cancelled')).toBeVisible()

  await expect(attendancePage.getByRole('heading', { name: 'Session cancelled' })).toHaveCount(0)
})
