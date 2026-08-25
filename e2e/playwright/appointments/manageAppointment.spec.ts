import { addDays, format } from 'date-fns'
import { expect, Page, test } from '@playwright/test'

import stubs from '../../../integration_tests/mockApis/stubs'
import { resetStubs } from '../../../integration_tests/mockApis/wiremock'
import { signIn } from '../helpers/auth'
import stubManageAppointmentScenario, {
  ManageAppointmentScenario,
  stubAppointmentDetails,
} from '../helpers/appointments/manageAppointment'
import { clickButton, clickLink, successBanner } from '../helpers/govuk'
import { expectPage } from '../helpers/page'

const expectAccessiblePage = (page: Page, heading: string | RegExp): Promise<void> => expectPage(page, heading, true)

const openAppointmentFromSearch = async (page: Page, appointmentDate: Date): Promise<void> => {
  await page.goto('/appointments')
  await expectAccessiblePage(page, /^Appointments$/)
  await clickLink(page, 'Manage existing appointments')

  await expectAccessiblePage(page, 'What date do you want to view appointments for?')
  await page.locator('#startDate').fill(format(appointmentDate, 'dd/MM/yyyy'))
  await clickButton(page, 'Continue')

  await expectAccessiblePage(page, 'Appointments dashboard')
  await expect(page.locator('[data-qa="result-location-0"]')).toContainText('Test Location 1')
  await expect(page.locator('[data-qa="result-location-1"]')).toContainText('In cell')
  const firstAppointment = page.getByRole('row').filter({ hasText: 'Test Location 1' })
  await clickLink(firstAppointment, /View Chaplaincy/)
  await expectAccessiblePage(page, 'Chaplain Meeting (Chaplaincy)')
}

const chooseCancellationReason = async (page: Page): Promise<void> => {
  await clickLink(page, 'Cancel appointment')
  await expectAccessiblePage(page, 'Do you want to show the cancelled appointment on the unlock list?')
  await page.getByRole('radio', { name: 'Yes - show the appointment as cancelled on the unlock list' }).check()
  await clickButton(page, 'Continue')
}

const expectCancelled = async (page: Page): Promise<void> => {
  await expectAccessiblePage(page, 'Chaplain Meeting (Chaplaincy)')
  await expect(page.locator('.govuk-notification-banner')).toContainText('Appointment cancelled')
}

const uncancelStandalone = async (page: Page, scenario: ManageAppointmentScenario): Promise<void> => {
  await clickLink(page, 'Uncancel appointment')
  await expectAccessiblePage(page, /Are you sure you want to uncancel this appointment/)
  await stubAppointmentDetails(scenario.activeDetails)
  await page.getByRole('radio', { name: 'Yes', exact: true }).check()
  await clickButton(page, 'Confirm')

  await expectAccessiblePage(page, 'Chaplain Meeting (Chaplaincy)')
  await expect(successBanner(page)).toContainText("You've uncancelled this appointment")
}

test.describe('Manage appointment lifecycle', () => {
  test.beforeEach(async () => {
    await resetStubs()
    await stubs.stubSignIn()
  })

  test('finds, cancels and uncancels a standalone appointment', async ({ page }) => {
    const tomorrow = addDays(new Date(), 1)
    const scenario = await stubManageAppointmentScenario(tomorrow)
    await signIn(page)

    await openAppointmentFromSearch(page, tomorrow)
    await chooseCancellationReason(page)

    await expectAccessiblePage(page, /Are you sure you want to cancel this appointment/)
    await stubAppointmentDetails(scenario.cancelledDetails)
    await page.getByRole('radio', { name: 'Yes', exact: true }).check()
    await clickButton(page, 'Confirm')

    await expectCancelled(page)
    await uncancelStandalone(page, scenario)
  })

  test('cancels and uncancels one appointment in a cancelled series', async ({ page }) => {
    const tomorrow = addDays(new Date(), 1)
    const scenario = await stubManageAppointmentScenario(tomorrow, true)
    await signIn(page)

    await openAppointmentFromSearch(page, tomorrow)
    await chooseCancellationReason(page)

    await expectAccessiblePage(page, /select which appointments you want to cancel/)
    await stubAppointmentDetails(scenario.cancelledDetails)
    await page.getByRole('radio', { name: /Just this one/ }).check()
    await clickButton(page, 'Confirm')
    await expectCancelled(page)

    await clickLink(page, 'Uncancel appointment')
    await expectAccessiblePage(page, /Are you sure you want to uncancel this appointment/)
    await stubAppointmentDetails(scenario.activeDetails)
    await page.getByRole('radio', { name: 'Yes', exact: true }).check()
    await clickButton(page, 'Continue')

    await expectAccessiblePage(page, /select which appointments you want to uncancel/)
    await page.getByRole('radio', { name: /Just this one/ }).check()
    await clickButton(page, 'Confirm')

    await expectAccessiblePage(page, 'Chaplain Meeting (Chaplaincy)')
    await expect(successBanner(page)).toContainText("You've uncancelled this appointment")
  })
})
