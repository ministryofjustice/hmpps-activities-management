import { expect, Page, test } from '@playwright/test'

import stubs from '../../../../integration_tests/mockApis/stubs'
import { resetStubs } from '../../../../integration_tests/mockApis/wiremock'

import {
  setupMultipleActivityAttendance,
  setupResidentialAttendance,
  stubMultipleActivitiesAttended,
} from '../../helpers/activities/attendance/recordAttendance'
import { signIn } from '../../helpers/auth'
import { clickButton, clickLink, successBanner } from '../../helpers/govuk'
import verifyPage from '../../helpers/page'

const attendanceRow = (page: Page, prisonerName: string, activityName: string) =>
  page
    .getByRole('row')
    .filter({
      has: page.locator('[data-qa="prisoner-details"]').filter({ hasText: prisonerName }),
    })
    .filter({
      has: page.locator('[data-qa="activity"]').filter({ hasText: new RegExp(`^${activityName}$`) }),
    })

test.beforeEach(async ({ page }) => {
  await resetStubs()
  await stubs.stubSignIn()
  await signIn(page)
})

test('a user can record attendance across multiple activities', async ({ page }) => {
  await setupMultipleActivityAttendance()

  await page.goto('/activities/attendance')
  await verifyPage(page, false)

  await clickLink(page, 'Record attendance and cancel activity sessions')
  await verifyPage(page, false)

  await page
    .getByRole('radio', {
      name: 'Select activities from the full list',
    })
    .check()

  await clickButton(page, 'Continue')
  await verifyPage(page, false)

  await page.getByRole('radio', { name: /^Today/ }).check()

  await page
    .getByRole('checkbox', {
      name: 'AM (morning)',
    })
    .check()

  await page
    .getByRole('checkbox', {
      name: 'PM (afternoon)',
    })
    .check()

  await clickButton(page, 'Continue')
  await verifyPage(page, false)

  const englishLevel1 = page.getByRole('row').filter({ hasText: 'English level 1' })

  const englishLevel2 = page.getByRole('row').filter({ hasText: 'English level 2' })

  await englishLevel1.getByRole('checkbox').check()
  await englishLevel2.getByRole('checkbox').check()

  await clickButton(page, 'Record or edit attendance')
  await verifyPage(page, false)

  const englishLevel1Aborah = attendanceRow(page, 'Aborah, Cudmastarie', 'English level 1')

  const englishLevel2Aborah = attendanceRow(page, 'Aborah, Cudmastarie', 'English level 2')

  await expect(englishLevel1Aborah).toContainText('Not recorded')
  await expect(englishLevel2Aborah).toContainText('Not recorded')

  await englishLevel1Aborah.getByRole('checkbox').check()
  await englishLevel2Aborah.getByRole('checkbox').check()

  await stubMultipleActivitiesAttended()

  await clickButton(page, 'Mark as attended')

  await verifyPage(page, false)

  await expect(successBanner(page)).toContainText('Attendance recorded')

  await expect(successBanner(page)).toContainText("You've saved attendance details for 2 attendees")

  await expect(attendanceRow(page, 'Aborah, Cudmastarie', 'English level 1')).toContainText('Attended')

  await expect(attendanceRow(page, 'Aborah, Cudmastarie', 'English level 2')).toContainText('Attended')
})

test('a user can record attendance by residential location', async ({ page }) => {
  await setupResidentialAttendance()

  await page.goto('/activities/attendance')
  await verifyPage(page, false)

  await clickLink(page, 'Record attendance and cancel activity sessions')
  await verifyPage(page, false)

  await page
    .getByRole('radio', {
      name: 'By residential location',
    })
    .check()

  await clickButton(page, 'Continue')
  await verifyPage(page, false)

  await page.getByRole('radio', { name: /^Today/ }).check()

  await page
    .getByRole('radio', {
      name: 'AM (morning)',
    })
    .check()

  await page
    .getByRole('radio', {
      name: 'Houseblock 1',
      exact: true,
    })
    .check()

  await clickButton(page, 'Continue')
  await verifyPage(page, false)

  await expect(
    page.getByRole('heading', {
      name: /Houseblock 1 - record or edit activity attendance/,
    }),
  ).toBeVisible()

  await expect(
    page.getByRole('heading', {
      name: '2 people allocated to activities',
    }),
  ).toBeVisible()

  await expect(page.getByText('Sessions people are allocated to:')).toContainText('2')

  await page
    .getByRole('checkbox', {
      name: 'Select Gregs, Stephen',
    })
    .check()

  await page
    .getByRole('checkbox', {
      name: 'Select Smith, John',
    })
    .check()

  await clickButton(page, 'Mark as attended')

  await verifyPage(page, false)

  await expect(successBanner(page)).toContainText('Attendance recorded')

  await expect(successBanner(page)).toContainText("You've saved attendance details for 2 attendees")
})
