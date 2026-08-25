import path from 'path'
import { addDays, format, subDays } from 'date-fns'
import { expect, Page, test } from '@playwright/test'

import stubs from '../../../integration_tests/mockApis/stubs'
import { resetStubs } from '../../../integration_tests/mockApis/wiremock'
import { signIn } from '../helpers/auth'
import stubCreateAppointmentScenario from '../helpers/appointments/createAppointment'
import { clickButton, clickLink, expectSummaryRow } from '../helpers/govuk'
import { expectPage } from '../helpers/page'

const expectAccessiblePage = (page: Page, heading: string | RegExp): Promise<void> => expectPage(page, heading, true)

const continueTo = async (page: Page, heading: string | RegExp, button: string | RegExp = 'Continue') => {
  await clickButton(page, button)
  await expectAccessiblePage(page, heading)
}

const selectAutocompleteOption = async (page: Page, label: string | RegExp, option: string): Promise<void> => {
  const input = page.getByRole('combobox', { name: label })
  await input.fill(option)
  await page.getByRole('option', { name: option, exact: true }).click()
}

const startGroupAppointment = async (page: Page): Promise<void> => {
  await page.goto('/appointments/create/start-group')
  await expectAccessiblePage(page, 'How do you want to select attendees?')
}

const addOnePrisoner = async (page: Page): Promise<void> => {
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
}

const addGroupFromCsv = async (page: Page): Promise<void> => {
  await page.getByRole('radio', { name: 'Add a group of people using a CSV file' }).check()
  await continueTo(page, 'Upload your list of prison numbers')

  await page.getByText('How to use a CSV file').click()
  const downloadPromise = page.waitForEvent('download')
  await clickLink(page, 'prison number list template')
  expect((await downloadPromise).suggestedFilename()).toEqual('prisoner-list.csv')

  await page
    .getByLabel('Upload your list of prison numbers')
    .setInputFiles(path.resolve('integration_tests/fixtures/fileUpload/upload-prisoner-list.csv'))
  await continueTo(page, 'Review who’s attending the appointment', 'Upload file')

  await expect(page.getByRole('row').filter({ hasText: 'Gregs, Stephen' })).toBeVisible()
  await expect(page.getByRole('row').filter({ hasText: 'Winchurch, David' })).toBeVisible()
  await clickButton(page, 'Add another person individually')
  await expectAccessiblePage(page, 'Who is the appointment for?')

  await page.getByLabel('Who is the appointment for?').fill('lee')
  await clickButton(page, 'Search')
  await expectAccessiblePage(page, 'Who is the appointment for?')
  await clickButton(page, 'Continue')

  await expectAccessiblePage(page, 'Review who’s attending the appointment')
  await expect(page.getByRole('row').filter({ hasText: 'Jacobson, Lee' })).toBeVisible()
  await continueTo(page, 'Review attendee alerts')

  await expect(page.locator('.alerts-list')).toContainText('Arsonist')
  await expect(page.locator('.alerts-list')).toContainText('CAT A')
  await expect(page.locator('.alerts-list')).toContainText('TACT')
  await continueTo(page, 'Review 2 people with non-associations')

  await expect(page.locator('[data-qa="attendee-numbers"]')).toContainText(
    '2 people with non-associations out of a total of 3 attendees',
  )
  await expect(page.locator('.govuk-summary-card')).toHaveCount(2)
  await continueTo(page, /Confirm that 2 people with non-assocations/)
  await continueTo(page, 'What’s the appointment?', 'Confirm')
}

const completeCoreDetails = async (page: Page, appointmentDate: Date): Promise<void> => {
  await selectAutocompleteOption(page, 'What’s the appointment?', 'Chaplaincy')
  await continueTo(page, 'Which tier is the appointment in?')

  await page.getByRole('radio', { name: 'Tier 2' }).check()
  await continueTo(page, 'Who hosts this appointment?')

  await page.getByRole('radio', { name: 'Prison staff' }).check()
  await continueTo(page, 'Where will the appointment take place?')

  await page.getByRole('radio', { name: 'Search for a location' }).check()
  await selectAutocompleteOption(page, 'Start typing a location and select from the list of options.', 'Chapel')
  await continueTo(page, 'Enter the date and time of the appointment')

  await page.locator('#startDate').fill(format(appointmentDate, 'dd/MM/yyyy'))
  await page.locator('#startTime-hour').selectOption('14')
  await page.locator('#startTime-minute').selectOption('0')
  await page.locator('#endTime-hour').selectOption('15')
  await page.locator('#endTime-minute').selectOption('30')
  await clickButton(page, 'Continue')
}

const finishFutureAppointment = async (page: Page, repeat: boolean): Promise<void> => {
  await expectAccessiblePage(page, 'Will the appointment repeat?')
  await page.getByRole('radio', { name: repeat ? 'Yes' : 'No', exact: true }).check()

  if (repeat) {
    await continueTo(page, 'How often will the appointment repeat?')
    await page.getByRole('radio', { name: 'Daily (includes weekends)' }).check()
    await page.locator('#numberOfAppointments').fill('7')
    await continueTo(page, 'Review scheduled events to avoid clashes')
  } else {
    await continueTo(page, 'Review scheduled events to avoid clashes')
  }

  await continueTo(page, /Add extra information/)
  await continueTo(page, 'Check and confirm the appointment details')
}

test.describe('Create appointments', () => {
  test.beforeEach(async () => {
    await resetStubs()
    await stubs.stubSignIn()
  })

  test('creates a standard group appointment and uses a check-answers change link', async ({ page }) => {
    const tomorrow = addDays(new Date(), 1)
    await stubCreateAppointmentScenario({ date: tomorrow, attendees: 'group', nonAssociations: true })
    await signIn(page)

    await startGroupAppointment(page)
    await addGroupFromCsv(page)
    await completeCoreDetails(page, tomorrow)
    await finishFutureAppointment(page, false)

    await expectSummaryRow(page, 'Appointment name', 'Chaplaincy')
    await expectSummaryRow(page, 'Location', 'Chapel')
    await expectSummaryRow(page, 'Repeats', 'No')

    await clickLink(page, 'Change change location')
    await expectAccessiblePage(page, 'Where will the appointment take place?')
    await continueTo(page, 'Check and confirm the appointment details')
    await expectSummaryRow(page, 'Location', 'Chapel')

    await clickButton(page, 'Confirm')
    await expectAccessiblePage(page, /Appointment scheduled/)
    await expect(page.locator('[data-qa="message"]')).toContainText(
      `You have successfully scheduled an appointment for 3 people on ${format(tomorrow, 'EEEE, d MMMM yyyy')}`,
    )

    await clickLink(page, /View, print movement slips and manage this appointment/)
    await expectAccessiblePage(page, 'Chaplain Meeting (Chaplaincy)')
    await expectSummaryRow(page, 'Location', 'Chapel')
    await expect(page.locator('[data-qa="prisoner-list-title"]')).toContainText('3 attendees')
  })

  test('creates a repeating appointment', async ({ page }) => {
    const tomorrow = addDays(new Date(), 1)
    await stubCreateAppointmentScenario({ date: tomorrow, repeat: true })
    await signIn(page)

    await startGroupAppointment(page)
    await addOnePrisoner(page)
    await completeCoreDetails(page, tomorrow)
    await finishFutureAppointment(page, true)

    await expectSummaryRow(page, 'Repeats', 'Yes')
    await expectSummaryRow(page, 'Frequency', 'Daily (includes weekends)')
    await expectSummaryRow(page, 'Number of appointments', '7')
    await clickButton(page, 'Confirm')

    await expectAccessiblePage(page, /Appointment scheduled/)
    await expect(page.locator('[data-qa="message"]')).toContainText(
      'It will repeat daily (includes weekends) for 7 appointments',
    )
  })

  test('creates a retrospective appointment and offers attendance recording', async ({ page }) => {
    const fiveDaysAgo = subDays(new Date(), 5)
    await stubCreateAppointmentScenario({ date: fiveDaysAgo })
    await signIn(page)

    await startGroupAppointment(page)
    await addOnePrisoner(page)
    await completeCoreDetails(page, fiveDaysAgo)

    await expectAccessiblePage(page, 'Check and confirm the appointment details')
    await expectSummaryRow(page, 'Repeats', 'No')
    await clickButton(page, 'Confirm')

    await expectAccessiblePage(page, /Appointment created/)
    await expect(page.locator('[data-qa="message"]')).toContainText(
      `You have successfully created an appointment for Stephen Gregs on ${format(fiveDaysAgo, 'EEEE, d MMMM yyyy')}`,
    )
    await expect(page.locator('[data-qa="view-appointment-link"]')).toHaveCount(0)
    await expect(page.locator('[data-qa="record-attendance-link"]')).toBeVisible()
  })
})
