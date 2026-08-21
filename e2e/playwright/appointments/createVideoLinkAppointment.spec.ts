import { addDays, format } from 'date-fns'
import { expect, Page, test } from '@playwright/test'

import stubs from '../../../integration_tests/mockApis/stubs'
import { resetStubs } from '../../../integration_tests/mockApis/wiremock'
import { signIn } from '../helpers/auth'
import stubVideoLinkAppointmentScenario from '../helpers/appointments/videoLinkAppointment'
import { clickButton, expectSummaryRow } from '../helpers/govuk'
import { expectPage } from '../helpers/page'

const expectAccessiblePage = (page: Page, heading: string | RegExp): Promise<void> => expectPage(page, heading, true)

const continueTo = async (page: Page, heading: string | RegExp): Promise<void> => {
  await clickButton(page, 'Continue')
  await expectAccessiblePage(page, heading)
}

const selectAutocompleteOption = async (page: Page, label: string | RegExp, option: string): Promise<void> => {
  const input = page.getByRole('combobox', { name: label })
  await input.fill(option)
  await page.getByRole('option', { name: option, exact: true }).click()
}

const startVideoLinkAppointment = async (page: Page, category: string): Promise<void> => {
  await page.goto('/appointments/create/start-group')
  await expectAccessiblePage(page, 'How do you want to select attendees?')

  await page.getByRole('radio', { name: 'Search for them one by one' }).check()
  await continueTo(page, 'Who is the appointment for?')
  await page.getByLabel('Who is the appointment for?').fill('A8644DY')
  await clickButton(page, 'Search')
  await expectAccessiblePage(page, 'Who is the appointment for?')
  await clickButton(page, 'Continue')

  await expectAccessiblePage(page, 'Review who’s attending the appointment')
  await expect(page.getByRole('row').filter({ hasText: 'Gregs, Stephen' })).toBeVisible()
  await continueTo(page, 'Review attendee alerts')
  await continueTo(page, 'What’s the appointment?')

  await selectAutocompleteOption(page, 'What’s the appointment?', category)
  await clickButton(page, 'Continue')
}

const selectVideoRoom = async (page: Page): Promise<void> => {
  await expectAccessiblePage(page, 'Where will the appointment take place?')
  await selectAutocompleteOption(page, 'Start typing a location and select from the list of options', 'VCC Room 1')
  await clickButton(page, 'Continue')
}

const enterDateAndTime = async (page: Page, date: Date, court: boolean): Promise<void> => {
  await expectAccessiblePage(page, 'Enter the date and time of the appointment')
  await page.locator('#date').fill(format(date, 'dd/MM/yyyy'))
  await page.locator('#startTime-hour').selectOption('14')
  await page.locator('#startTime-minute').selectOption('0')
  await page.locator('#endTime-hour').selectOption('15')
  await page.locator('#endTime-minute').selectOption('30')

  if (court) {
    await page
      .getByRole('group', { name: 'Do you want to add a pre-court hearing briefing?' })
      .getByRole('radio', { name: 'No' })
      .check()
    await page
      .getByRole('group', { name: 'Do you want to add a post-court hearing briefing?' })
      .getByRole('radio', { name: 'No' })
      .check()
  }

  await continueTo(page, 'Review scheduled events to avoid clashes')
  await continueTo(page, court ? 'Enter link details' : 'Add extra information')
}

const addNotes = async (page: Page, staffNotes: string, prisonerNotes: string): Promise<void> => {
  await page.locator('#notesForStaff').fill(staffNotes)
  await page.locator('#notesForPrisoners').fill(prisonerNotes)
  await continueTo(page, 'Check and confirm appointment details')
}

test.describe('Create video link appointments', () => {
  test.beforeEach(async () => {
    await resetStubs()
    await stubs.stubSignIn()
  })

  test('creates a video link court hearing', async ({ page }) => {
    const tomorrow = addDays(new Date(), 1)
    await stubVideoLinkAppointmentScenario(tomorrow, 'court')
    await signIn(page)

    await startVideoLinkAppointment(page, 'Video Link - Court Hearing')
    await expectAccessiblePage(page, 'Enter the type of meeting')
    await selectAutocompleteOption(page, 'Select the court the booking is for', 'Aylesbury Crown')
    await selectAutocompleteOption(page, 'Select the type of hearing', 'Bail')
    await clickButton(page, 'Continue')

    await selectVideoRoom(page)
    await enterDateAndTime(page, tomorrow, true)

    await page
      .getByRole('group', { name: 'Do you know the video link for this hearing?' })
      .getByRole('radio', { name: 'Yes' })
      .check()
    await page.locator('#videoLinkUrl').fill('https://test.video.link/1234')
    await page.getByRole('group', { name: 'Is a guest pin required?' }).getByRole('radio', { name: 'Yes' }).check()
    await page.locator('#guestPin').fill('54321')
    await continueTo(page, 'Add extra information')
    await addNotes(page, 'staff notes for the hearing', 'prisoners notes for the hearing')

    await expectSummaryRow(page, 'Court', 'Aylesbury Crown')
    await expectSummaryRow(page, 'Hearing type', 'Bail')
    await expectSummaryRow(page, 'Court hearing link', 'https://test.video.link/1234')
    await expectSummaryRow(page, 'Guest pin', '54321')
    await clickButton(page, 'Confirm')

    await expectAccessiblePage(page, 'Appointment scheduled')
    await expect(page.locator('[data-qa="message"]')).toContainText(
      `You have successfully scheduled an appointment for Stephen Gregs on ${format(tomorrow, 'EEEE, d MMMM yyyy')}`,
    )
    await expect(page.locator('[data-qa="view-appointment-link"]')).toBeVisible()
  })

  test('creates a video link probation meeting using the meeting-type select', async ({ page }) => {
    const tomorrow = addDays(new Date(), 1)
    await stubVideoLinkAppointmentScenario(tomorrow, 'probation')
    await signIn(page)

    await startVideoLinkAppointment(page, 'Video Link - Probation Meeting')
    await selectVideoRoom(page)

    await expectAccessiblePage(page, 'Enter appointment details')
    await page
      .getByRole('group', { name: 'Which probation team is this booking for?' })
      .getByRole('radio', { name: 'Select from the list of probation teams' })
      .check()
    await selectAutocompleteOption(page, 'Select the probation team the booking is for', 'Barking - Probation')
    await page.getByLabel('Select meeting type').selectOption({ label: 'Other' })
    await page
      .getByRole('group', { name: 'Do you know the details of the probation officer?' })
      .getByRole('radio', { name: 'No' })
      .check()
    await clickButton(page, 'Continue')

    await enterDateAndTime(page, tomorrow, false)
    await addNotes(page, 'some staff notes', 'some prisoners notes')

    await expectSummaryRow(page, 'Probation team', 'Barking - Probation')
    await expectSummaryRow(page, 'Meeting type', 'Other')
    await expectSummaryRow(page, 'Location', 'VCC Room 1')
    await clickButton(page, 'Confirm')

    await expectAccessiblePage(page, 'Appointment scheduled')
    await expect(page.locator('[data-qa="message"]')).toContainText(
      `You have successfully scheduled an appointment for Stephen Gregs on ${format(tomorrow, 'EEEE, d MMMM yyyy')}`,
    )
    await expect(page.locator('[data-qa="view-appointment-link"]')).toBeVisible()
  })
})
