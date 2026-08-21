import { addMonths, format } from 'date-fns'
import { expect, Page, test } from '@playwright/test'

import stubs from '../../../../integration_tests/mockApis/stubs'
import { resetStubs } from '../../../../integration_tests/mockApis/wiremock'
import stubCreateActivity from '../../helpers/activities/createActivityStubs'
import { signIn } from '../../helpers/auth'
import { clickButton, clickLink, expectSummaryRow } from '../../helpers/govuk'
import { expectPage } from '../../helpers/page'

const expectAccessiblePage = (page: Page, heading: string | RegExp): Promise<void> => expectPage(page, heading, true)

const continueTo = async (page: Page, heading: string | RegExp): Promise<void> => {
  await clickButton(page, 'Continue')
  await expectAccessiblePage(page, heading)
}

const selectAutocompleteOption = async (page: Page, label: string, option: string): Promise<void> => {
  const input = page.getByRole('combobox', { name: label })
  await input.fill(option)
  const optionName = new RegExp(option.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
  await page.getByRole('option', { name: optionName }).click()
}

const openCreateActivityJourney = async (page: Page): Promise<void> => {
  await expectAccessiblePage(page, 'Select service')
  await clickLink(page, 'Activities, unlock and attendance')
  await expectAccessiblePage(page, 'Activities, unlock and attendance')

  await clickLink(page, 'Allocate people to activities')
  await expectAccessiblePage(page, 'Allocate people to activities')

  const createActivityCard = page.locator('[data-qa="create-an-activity"]')
  await expect(createActivityCard).toContainText('Create an activity')
  await clickLink(createActivityCard, 'Create an activity')
  await expectAccessiblePage(page, 'Select a category for the new activity')
}

const completeActivityDetails = async (page: Page): Promise<void> => {
  await expect(page.locator('[data-qa="caption"]')).toContainText('Create an activity')
  await page.getByRole('radio', { name: 'Gym, sport, fitness' }).check()
  await continueTo(page, "What's the new activity called?")

  await page.locator('#name').fill('5-a-side Football')
  await continueTo(page, 'Select a tier for the new activity')

  await page.getByRole('radio', { name: 'Tier 2' }).check()
  await continueTo(page, 'Who leads or organises this activity?')

  await page.getByRole('radio', { name: 'Prison staff' }).check()
  await continueTo(page, 'Workplace risk assessment levels: who is suitable for this activity?')

  await page.getByRole('radio', { name: 'Only people with a low workplace risk assessment are suitable' }).check()
  await continueTo(page, 'Will people be paid for attending this activity?')

  await page.getByRole('radio', { name: 'Yes' }).check()
  await continueTo(page, 'Choose what kind of pay rate you want to set up for this activity')

  await page.getByRole('radio', { name: 'Standard', exact: true }).check()
  await continueTo(page, 'Enter pay amount and pay band name for the Standard incentive level pay rate')

  await page.locator('#rate').fill('1.00')
  await page.locator('#bandId').selectOption({ label: 'Low' })
  await expect(page.locator('[data-qa="futurePayRateDetails"]')).toBeVisible()
  await clickButton(page, 'Save and continue')
  await expectAccessiblePage(page, 'Review pay rates for 5-a-side Football')

  await expect(page.locator('.govuk-back-link')).toHaveText('Back to risk level')
  await expect(page.locator('.govuk-summary-list__row')).toHaveCount(1)
  await expectSummaryRow(page, 'Low', '£1.00')
  await clickButton(page, 'Add a pay rate')
  await expectAccessiblePage(page, 'Choose what kind of pay rate you want to set up for this activity')

  await page.getByRole('radio', { name: 'Enhanced', exact: true }).check()
  await continueTo(page, 'Enter pay amount and pay band name for the Enhanced incentive level pay rate')

  await page.locator('#rate').fill('1.50')
  await page.locator('#bandId').selectOption({ label: 'Medium' })
  await clickButton(page, 'Save and continue')
  await expectAccessiblePage(page, 'Review pay rates for 5-a-side Football')

  await expect(page.locator('.govuk-summary-list__row')).toHaveCount(2)
  await expectSummaryRow(page, 'Low', '£1.00')
  await expectSummaryRow(page, 'Medium', '£1.50')
  await continueTo(page, 'Do people allocated to this activity need certain education levels or other qualifications?')

  await page.getByRole('radio', { name: 'Yes' }).check()
  await continueTo(page, 'Select education levels and qualifications')

  await selectAutocompleteOption(page, 'Subject or skill', 'English Language')
  await selectAutocompleteOption(page, 'Education level or other qualification', 'Reading Measure 17.0')
  await continueTo(page, 'Review education levels and qualifications')

  await expect(page.locator('.govuk-summary-list__row')).toHaveCount(1)
  await expectSummaryRow(page, 'Reading Measure 17.0', 'English Language')
  await clickButton(page, 'Confirm')
  await expectAccessiblePage(page, 'Enter the start date for this activity')

  await page.locator('#startDate').fill(format(addMonths(new Date(), 1), 'dd/MM/yyyy'))
  await continueTo(page, 'Do you want to enter an end date for this activity?')

  await page.getByRole('radio', { name: 'Yes' }).check()
  await continueTo(page, 'Enter the end date for this activity')

  await page.locator('#endDate').fill(format(addMonths(new Date(), 8), 'dd/MM/yyyy'))
  await continueTo(page, 'How often do you want the schedule to repeat?')
}

const selectSessionOptions = async (page: Page, day: string, sessions: Array<'AM' | 'PM' | 'ED'>): Promise<void> => {
  if (sessions.length === 0) return

  const [session, ...remainingSessions] = sessions
  await page.locator(`input[name="timeSlots${day}"][value="${session}"]`).check()
  await selectSessionOptions(page, day, remainingSessions)
}

const selectSessions = async (
  page: Page,
  selections: Array<{ day: string; sessions: Array<'AM' | 'PM' | 'ED'> }>,
): Promise<void> => {
  if (selections.length === 0) return

  const [{ day, sessions }, ...remainingSelections] = selections

  await page.locator(`input[name="days"][value="${day.toLowerCase()}"]`).check()
  await selectSessionOptions(page, day, sessions)

  await selectSessions(page, remainingSelections)
}

const completeLocationAndCapacity = async (page: Page): Promise<void> => {
  await page.getByRole('radio', { name: 'Yes' }).check()
  await continueTo(page, 'Where does this activity take place?')

  await page.getByRole('radio', { name: 'Search for a location' }).check()
  await selectAutocompleteOption(
    page,
    'Start typing a location and select from the list of options.',
    'HB2 Classroom 2',
  )
  await continueTo(page, 'How many people can be allocated to this activity?')

  await page.locator('#capacity').fill('6')
  await continueTo(page, 'Check details for 5-a-side Football')
}

const createActivityAndVerifyConfirmation = async (page: Page): Promise<void> => {
  await clickButton(page, 'Create activity')
  await expectAccessiblePage(page, "You've created a new activity: 5-a-side Football")

  const allocateLink = page.locator('[data-qa="allocate-link"]')
  const payReviewLink = page.locator('[data-qa="review-pay-link"] a')

  await expect(allocateLink).toHaveAttribute('href', '/activities/allocation-dashboard/2#candidates-tab')
  await expect(payReviewLink).toHaveAttribute('href', '/activities/edit/2/check-pay')
}

test.describe('Create an activity', () => {
  test.beforeEach(async ({ page }) => {
    await resetStubs()
    await stubs.stubSignIn()
    await stubCreateActivity()
    await signIn(page)
  })

  test('creates a standard activity using prison regime times', async ({ page }) => {
    await openCreateActivityJourney(page)
    await completeActivityDetails(page)

    await page.getByRole('radio', { name: 'Weekly', exact: true }).check()
    await continueTo(page, 'Select the days and sessions when this activity runs')

    await selectSessions(page, [
      { day: 'Monday', sessions: ['AM'] },
      { day: 'Wednesday', sessions: ['AM', 'PM'] },
      { day: 'Thursday', sessions: ['AM', 'PM', 'ED'] },
    ])
    await continueTo(page, "Do sessions of this activity follow the prison's regime times?")

    await page.getByRole('radio', { name: 'Yes' }).check()
    await continueTo(page, 'Does this activity run on bank holidays?')

    await completeLocationAndCapacity(page)
    await createActivityAndVerifyConfirmation(page)
  })

  test('creates a two-week activity using custom session times', async ({ page }) => {
    await openCreateActivityJourney(page)
    await completeActivityDetails(page)

    await page.getByRole('radio', { name: '2 Weekly', exact: true }).check()
    await continueTo(page, 'Week 1 of 2: select the days and sessions when this activity runs')

    await selectSessions(page, [{ day: 'Monday', sessions: ['AM'] }])
    await continueTo(page, 'Week 2 of 2: select the days and sessions when this activity runs')

    await selectSessions(page, [{ day: 'Tuesday', sessions: ['PM'] }])
    await continueTo(page, "Do sessions of this activity follow the prison's regime times?")

    await page.getByRole('radio', { name: 'No, set different start and end times' }).check()
    await continueTo(page, 'Select the start and end times for the sessions when this activity runs')

    await page.locator('#startTimes-1-MONDAY-AM-hour').selectOption('10')
    await page.locator('#startTimes-1-MONDAY-AM-minute').selectOption('45')
    await page.locator('#endTimes-1-MONDAY-AM-hour').selectOption('11')
    await page.locator('#endTimes-1-MONDAY-AM-minute').selectOption('50')
    await page.locator('#startTimes-2-TUESDAY-PM-hour').selectOption('14')
    await page.locator('#startTimes-2-TUESDAY-PM-minute').selectOption('35')
    await page.locator('#endTimes-2-TUESDAY-PM-hour').selectOption('16')
    await page.locator('#endTimes-2-TUESDAY-PM-minute').selectOption('50')
    await continueTo(page, 'Does this activity run on bank holidays?')

    await completeLocationAndCapacity(page)
    await createActivityAndVerifyConfirmation(page)
  })
})
