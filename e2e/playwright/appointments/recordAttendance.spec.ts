import { expect, test } from '@playwright/test'

import stubs from '../../../integration_tests/mockApis/stubs'
import { resetStubs } from '../../../integration_tests/mockApis/wiremock'
import setupRecordAppointmentAttendanceScenario from '../helpers/appointments/recordAttendance'
import { signIn } from '../helpers/auth'
import verifyPage from '../helpers/page'

test.beforeEach(async ({ page }) => {
  await resetStubs()
  await stubs.stubSignIn()
  await setupRecordAppointmentAttendanceScenario()
  await signIn(page)
})

test('a user can record and edit appointment attendance', async ({ page }) => {
  await page.goto('/appointments')
  await verifyPage(page, true)

  await page.getByRole('link', { name: /Record appointment attendance/ }).click()
  await verifyPage(page, true)

  await page.getByRole('radio', { name: /^Today/ }).check()
  await page.getByRole('button', { name: 'Continue' }).click()

  await expect(
    page.getByRole('heading', {
      name: 'Find an appointment to record or edit attendance',
    }),
  ).toBeVisible()
  await verifyPage(page, true)

  await page.getByRole('checkbox', { name: 'Select Gym' }).check()

  await page.getByRole('checkbox', { name: 'Select Chaplaincy' }).check()

  await page.getByRole('button', { name: 'Record or edit attendance' }).click()

  await expect(
    page.getByRole('heading', {
      name: 'Record attendance at 2 appointments',
    }),
  ).toBeVisible()
  await verifyPage(page, true)

  const adalieRow = page.getByRole('row').filter({ hasText: 'Adalie, Izrmonntas' })

  const augevieveRow = page.getByRole('row').filter({ hasText: 'Augevieve, Uhohew' })

  await adalieRow.getByRole('checkbox').check()
  await augevieveRow.getByRole('checkbox').check()

  await page.getByRole('button', { name: 'Mark as attended' }).click()

  await expect(page.getByRole('heading', { name: 'Attendance recorded' })).toBeVisible()
  await verifyPage(page, true)

  await expect(page.getByText("You've saved attendance details for 2 attendees")).toBeVisible()

  const existingAttendanceRow = page
    .getByRole('row')
    .filter({ hasText: 'Alfres, Bumahwaju' })
    .filter({ hasText: 'Gym' })

  await existingAttendanceRow.getByRole('link', { name: /View or edit/ }).click()

  await expect(
    page.getByRole('heading', {
      name: 'Attendance record for Bumahwaju Alfres',
    }),
  ).toBeVisible()
  await verifyPage(page, true)

  const summaryRows = page.locator('.govuk-summary-list__row')

  await expect(summaryRows.filter({ hasText: 'Attendance' })).toContainText('Attended')

  await expect(summaryRows.filter({ hasText: 'Recorded by' })).toContainText('jsmith - J. Smith')

  await page.getByRole('link', { name: /^Change/ }).click()

  await expect(
    page.getByRole('heading', {
      name: 'Change attendance details for Bumahwaju Alfres',
    }),
  ).toBeVisible()
  await verifyPage(page, true)

  await page.getByRole('radio', { name: 'No', exact: true }).check()
  await page.getByRole('button', { name: 'Continue' }).click()

  await expect(page.getByRole('heading', { name: 'Non-attendance recorded' })).toBeVisible()
  await verifyPage(page, true)

  await expect(page.getByText("You've saved details for Bumahwaju Alfres.")).toBeVisible()
})
