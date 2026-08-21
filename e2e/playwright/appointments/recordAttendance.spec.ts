import { expect, test } from '@playwright/test'

import stubs from '../../../integration_tests/mockApis/stubs'
import { resetStubs } from '../../../integration_tests/mockApis/wiremock'
import setupRecordAppointmentAttendanceScenario from '../helpers/appointments/recordAttendance'
import { signIn } from '../helpers/auth'
import { clickButton, clickLink, expectSummaryRow } from '../helpers/govuk'
import verifyPage, { expectPage } from '../helpers/page'

test.beforeEach(async ({ page }) => {
  await resetStubs()
  await stubs.stubSignIn()
  await setupRecordAppointmentAttendanceScenario()
  await signIn(page)
})

test('a user can record and edit appointment attendance', async ({ page }) => {
  await page.goto('/appointments')
  await verifyPage(page, true)

  await clickLink(page, /Record appointment attendance/)
  await verifyPage(page, true)

  await page.getByRole('radio', { name: /^Today/ }).check()
  await clickButton(page, 'Continue')

  await expectPage(page, 'Find an appointment to record or edit attendance', true)

  await page.getByRole('checkbox', { name: 'Select Gym' }).check()

  await page.getByRole('checkbox', { name: 'Select Chaplaincy' }).check()

  await clickButton(page, 'Record or edit attendance')

  await expectPage(page, 'Record attendance at 2 appointments', true)

  const adalieRow = page.getByRole('row').filter({ hasText: 'Adalie, Izrmonntas' })

  const augevieveRow = page.getByRole('row').filter({ hasText: 'Augevieve, Uhohew' })

  await adalieRow.getByRole('checkbox').check()
  await augevieveRow.getByRole('checkbox').check()

  await clickButton(page, 'Mark as attended')

  await expectPage(page, 'Attendance recorded', true)

  await expect(page.getByText("You've saved attendance details for 2 attendees")).toBeVisible()

  const existingAttendanceRow = page
    .getByRole('row')
    .filter({ hasText: 'Alfres, Bumahwaju' })
    .filter({ hasText: 'Gym' })

  await clickLink(existingAttendanceRow, /View or edit/)

  await expectPage(page, 'Attendance record for Bumahwaju Alfres', true)

  await expectSummaryRow(page, 'Attendance', 'Attended')
  await expectSummaryRow(page, 'Recorded by', 'jsmith - J. Smith')

  await clickLink(page, /^Change/)

  await expectPage(page, 'Change attendance details for Bumahwaju Alfres', true)

  await page.getByRole('radio', { name: 'No', exact: true }).check()
  await clickButton(page, 'Continue')

  await expectPage(page, 'Non-attendance recorded', true)

  await expect(page.getByText("You've saved details for Bumahwaju Alfres.")).toBeVisible()
})
