import { expect, test } from '@playwright/test'

import stubs from '../../../../integration_tests/mockApis/stubs'
import { resetStubs } from '../../../../integration_tests/mockApis/wiremock'
import setupRecordNonAttendanceScenario from '../../helpers/activities/recordNonAttendance'
import { signIn } from '../../helpers/auth'

test.beforeEach(async ({ page }) => {
  await resetStubs()
  await stubs.stubSignIn()
  await setupRecordNonAttendanceScenario()
  await signIn(page)
})

test('a user can review refusals and record non-attendance', async ({ page }) => {
  await page.goto('/activities/attendance-summary/summary?date=2023-02-02')

  const dailySummary = page.getByRole('tabpanel', { name: 'Daily summary' })

  await dailySummary.getByRole('link', { name: 'All refused' }).click()

  await expect(page.getByRole('heading', { name: 'All refusals to attend' })).toBeVisible()

  const refusalRow = page.getByRole('row').filter({ hasText: 'Arianniver, Eeteljan' })

  await expect(refusalRow).toContainText('English level 1')
  await expect(refusalRow).toContainText('Incentive level warning')

  const attendancePagePromise = page.waitForEvent('popup')

  await refusalRow.getByRole('link', { name: 'English level 1' }).click()

  const attendancePage = await attendancePagePromise

  await attendancePage.getByRole('checkbox', { name: 'Select Aborah, Cudmastarie' }).check()

  await attendancePage.getByRole('button', { name: 'Mark as not attended' }).click()

  await attendancePage.getByRole('radio', { name: /^Sick/ }).check()

  await expect(attendancePage.locator('#notAttendedData-0-sickPay')).toBeVisible()

  await attendancePage.getByRole('button', { name: 'Confirm and record attendance' }).click()

  await expect(attendancePage.getByRole('alert')).toContainText('Select if Cudmastarie Aborah should be paid')

  await attendancePage.locator('#notAttendedData-0-sickPay').check()

  await attendancePage.getByRole('button', { name: 'Confirm and record attendance' }).click()

  await expect(attendancePage.getByRole('heading', { name: 'Attendance recorded' })).toBeVisible()

  await expect(attendancePage.getByText("You've saved attendance details for Cudmastarie Aborah")).toBeVisible()
})
