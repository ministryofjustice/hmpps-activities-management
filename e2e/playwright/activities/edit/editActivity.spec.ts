import { expect, test } from '@playwright/test'

import stubs from '../../../../integration_tests/mockApis/stubs'
import { resetStubs } from '../../../../integration_tests/mockApis/wiremock'

import stubEditTwoWeekActivity from '../../helpers/activities/editActivity'
import { signIn } from '../../helpers/auth'
import { clickButton, successBanner } from '../../helpers/govuk'
import { expectPage } from '../../helpers/page'

test.describe('Edit an activity', () => {
  test.beforeEach(async ({ page }) => {
    await resetStubs()
    await stubs.stubSignIn()
    await stubEditTwoWeekActivity()
    await signIn(page)
  })

  test('edits the days, sessions and custom times for a two-week activity', async ({ page }) => {
    await page.goto('/activities/view/2')

    await expectPage(page, 'Edit activity details', false)

    await page.locator('[data-qa="change-schedule-link"]').first().click()

    await expectPage(page, /Week 1 of 2: Select what you want to change/, false)

    await page
      .getByRole('radio', {
        name: 'Days and sessions when this activity runs',
      })
      .check()

    await clickButton(page, 'Continue')

    await expectPage(page, /Week 1 of 2: change the days and sessions when this activity runs/i, false)

    await expect(page.locator('input[name="days"][value="monday"]')).toBeChecked()
    await expect(page.locator('input[name="days"][value="thursday"]')).toBeChecked()

    await expect(page.locator('input[name="timeSlotsMonday"][value="AM"]')).toBeChecked()

    for (const day of ['Monday', 'Tuesday', 'Wednesday', 'Thursday']) {
      await page.locator(`input[name="timeSlots${day}"][value="AM"]`).uncheck()

      await page.locator(`input[name="days"][value="${day.toLowerCase()}"]`).uncheck()
    }

    await page.locator('input[name="days"][value="monday"]').check()
    await page.locator('input[name="timeSlotsMonday"][value="AM"]').check()

    await page.locator('input[name="days"][value="wednesday"]').check()
    await page.locator('input[name="timeSlotsWednesday"][value="AM"]').check()
    await page.locator('input[name="timeSlotsWednesday"][value="PM"]').check()

    await clickButton(page, 'Update days and sessions')

    await expectPage(page, 'Change the start and end times for the sessions when this activity runs', false)

    // assert existing week 1 time.
    await expect(page.locator('#startTimes-1-MONDAY-AM-hour')).toHaveValue('9')
    await expect(page.locator('#startTimes-1-MONDAY-AM-minute')).toHaveValue('00')
    await expect(page.locator('#endTimes-1-MONDAY-AM-hour')).toHaveValue('12')
    await expect(page.locator('#endTimes-1-MONDAY-AM-minute')).toHaveValue('00')

    // assert Week 2 intact while week 1 is being edited.
    await expect(page.locator('#startTimes-2-MONDAY-PM-hour')).toHaveValue('13')
    await expect(page.locator('#startTimes-2-MONDAY-PM-minute')).toHaveValue('30')
    await expect(page.locator('#endTimes-2-MONDAY-PM-hour')).toHaveValue('17')
    await expect(page.locator('#endTimes-2-MONDAY-PM-minute')).toHaveValue('00')

    // Set custom times for the new session.
    await page.locator('#startTimes-1-WEDNESDAY-PM-hour').selectOption('14')
    await page.locator('#startTimes-1-WEDNESDAY-PM-minute').selectOption('45')
    await page.locator('#endTimes-1-WEDNESDAY-PM-hour').selectOption('17')
    await page.locator('#endTimes-1-WEDNESDAY-PM-minute').selectOption('50')

    await clickButton(page, 'Continue')

    await expectPage(page, 'Edit activity details', false)

    await expect(successBanner(page)).toContainText('Activity updated')
    await expect(successBanner(page)).toContainText("You've updated the daily schedule for English level 1")
  })
})
