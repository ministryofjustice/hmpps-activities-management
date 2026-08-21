import { format } from 'date-fns'
import { expect, Page, test } from '@playwright/test'

import stubs from '../../../integration_tests/mockApis/stubs'
import { resetStubs } from '../../../integration_tests/mockApis/wiremock'
import { signIn } from '../helpers/auth'
import stubAttendanceSummaryScenario from '../helpers/appointments/attendanceSummary'
import { clickButton, clickLink } from '../helpers/govuk'
import { expectPage } from '../helpers/page'

const expectAccessiblePage = (page: Page, heading: string | RegExp): Promise<void> => expectPage(page, heading, true)

const openAttendanceSummary = async (page: Page): Promise<void> => {
  await page.goto('/appointments')
  await expectAccessiblePage(page, /^Appointments$/)
  await clickLink(page, 'View appointments attendance summary')
  await expectAccessiblePage(page, 'When do you want to see the attendance summary for?')
}

test.describe('Appointment attendance summary', () => {
  test.beforeEach(async () => {
    await resetStubs()
    await stubs.stubSignIn()
  })

  test('shows current totals and attended appointment data', async ({ page }) => {
    await stubAttendanceSummaryScenario()
    await signIn(page)
    await openAttendanceSummary(page)

    await page.getByRole('radio', { name: /^Today/ }).check()
    await clickButton(page, 'Continue')
    await expectAccessiblePage(page, 'Appointments attendance summary')

    await expect(page.locator('[data-qa="appointmentsNotCancelledTotal"]')).toContainText(
      '38 attendees for 8 appointments',
    )
    await expect(page.locator('[data-qa="attended"]')).toContainText('17')
    await expect(page.locator('[data-qa="notAttended"]')).toContainText('9')
    await expect(page.locator('[data-qa="notRecorded"]')).toContainText('12')
    await expect(page.locator('[data-qa="tier1"]')).toContainText('3')
    await expect(page.locator('[data-qa="tier2"]')).toContainText('8')
    await expect(page.locator('[data-qa="routine"]')).toContainText('6')

    await clickLink(page.locator('[data-qa="attended"]'), 'All attended')
    await expectAccessiblePage(page, 'All attended')
    await expect(page.locator('[data-qa="subTitle"]')).toContainText('17 attended')
    await expect(page.getByRole('columnheader')).toHaveText([
      'Attendee',
      'Cell location',
      'Appointment',
      'Time and date',
    ])
    await expect(page.locator('[data-qa="appointment-attendance-data"] tbody tr')).toHaveCount(17)

    await page.getByLabel('Search by name or prison number').fill('Aborah')
    await clickButton(page, 'Search')
    await expectAccessiblePage(page, 'All attended')
    await expect(page).toHaveURL(/searchTerm=Aborah/)
    await expect(page.locator('[data-qa="appointment-attendance-data"]')).toContainText('Aborah')
  })

  test('uses historical wording and hides refresh after seven days', async ({ page }) => {
    const { eightDaysAgo } = await stubAttendanceSummaryScenario()
    await signIn(page)
    await openAttendanceSummary(page)

    await page.getByRole('radio', { name: 'A different date' }).check()
    await page.locator('#date').fill(format(eightDaysAgo, 'dd/MM/yyyy'))
    await clickButton(page, 'Continue')
    await expectAccessiblePage(page, 'Appointments attendance summary')

    await expect(page.locator('[data-qa="notRecorded"]')).toContainText('Not recorded')
    await expect(page.locator('[data-qa="notRecorded"]')).not.toContainText('Not recorded yet')
    await expect(page.locator('[data-qa="refresh-button"]')).toHaveCount(0)

    await clickLink(page.locator('[data-qa="notRecorded"]'), 'All not recorded')
    await expectAccessiblePage(page, 'All not recorded')
    await expect(page.locator('[data-qa="subTitle"]')).toContainText('12 not recorded')
    await expect(page.locator('[data-qa="subTitle"]')).not.toContainText('not recorded yet')
    await expect(page.locator('[data-qa="refresh-button"]')).toHaveCount(0)
  })
})
