import { expect, test } from '@playwright/test'

import stubs from '../../../../integration_tests/mockApis/stubs'
import { resetStubs } from '../../../../integration_tests/mockApis/wiremock'
import setupRecordNonAttendanceScenario from '../../helpers/activities/attendance/recordNonAttendance'
import { signIn } from '../../helpers/auth'
import { clickButton, clickLink, expectHeading } from '../../helpers/govuk'
import verifyPage from '../../helpers/page'

test.beforeEach(async ({ page }) => {
  await resetStubs()
  await stubs.stubSignIn()
  await setupRecordNonAttendanceScenario()
  await signIn(page)
})

test('a user can review refusals and record non-attendance', async ({ page }) => {
  await page.goto('/activities/attendance-summary/summary?date=2023-02-02')
  await verifyPage(page, true)

  const dailySummary = page.getByRole('tabpanel', { name: 'Daily summary' })

  await clickLink(dailySummary, 'All refused')

  await expectHeading(page, 'All refusals to attend')
  await verifyPage(page, true)

  const refusalRow = page.getByRole('row').filter({ hasText: 'Arianniver, Eeteljan' })

  await expect(refusalRow).toContainText('English level 1')
  await expect(refusalRow).toContainText('Incentive level warning')

  const attendancePagePromise = page.waitForEvent('popup')

  await clickLink(refusalRow, 'English level 1')

  const attendancePage = await attendancePagePromise
  await verifyPage(attendancePage, true)

  await attendancePage.getByRole('checkbox', { name: 'Select Aborah, Cudmastarie' }).check()

  await clickButton(attendancePage, 'Mark as not attended')
  await verifyPage(attendancePage, true)

  await attendancePage.getByRole('radio', { name: /^Sick/ }).check()

  await expect(attendancePage.locator('#notAttendedData-0-sickPay')).toBeVisible()

  await clickButton(attendancePage, 'Confirm and record attendance')

  await expect(attendancePage.getByRole('alert')).toContainText('Select if Cudmastarie Aborah should be paid')
  await verifyPage(attendancePage, true)

  await attendancePage.locator('#notAttendedData-0-sickPay').check()

  await clickButton(attendancePage, 'Confirm and record attendance')

  await expectHeading(attendancePage, 'Attendance recorded')
  await verifyPage(attendancePage, true)

  await expect(attendancePage.getByText("You've saved attendance details for Cudmastarie Aborah")).toBeVisible()
})
