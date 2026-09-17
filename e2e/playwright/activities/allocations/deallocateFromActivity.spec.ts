import { expect, test } from '@playwright/test'
import { addMonths, format, subDays, subWeeks } from 'date-fns'
import stubs from '../../../../integration_tests/mockApis/stubs'
import { resetStubs } from '../../../../integration_tests/mockApis/wiremock'
import { signIn } from '../../helpers/auth'
import setupDeallocationScenario from '../../helpers/activities/allocations/deallocation'
import { clickButton, clickLink, successBanner, expectSummaryRow } from '../../helpers/govuk'
import verifyPage, { expectPage } from '../../helpers/page'

test.beforeEach(async ({ page }) => {
  await resetStubs()
  await stubs.stubSignIn()
  await signIn(page)
})

test('a user can end allocations on a future date', async ({ page }) => {
  const activityStartDate = subDays(subWeeks(new Date(), 2), 1)
  const endDate = addMonths(new Date(), 8)

  await setupDeallocationScenario(activityStartDate)

  await page.goto('/activities/allocation-dashboard')
  await verifyPage(page, true)

  await clickLink(page, 'English level 1')
  await verifyPage(page, true)

  const currentlyAllocated = page.getByRole('table', {
    name: 'Currently allocated',
  })

  await currentlyAllocated.getByRole('row').filter({ hasText: 'G4793VF' }).getByRole('checkbox').check()

  await currentlyAllocated.getByRole('row').filter({ hasText: 'A1351DZ' }).getByRole('checkbox').check()

  await clickButton(page, 'End allocation')
  await verifyPage(page, true)

  await page.getByRole('radio', { name: 'On a different date' }).check()

  await page.getByLabel('Other date').fill(format(endDate, 'dd/MM/yyyy'))

  await clickButton(page, 'Continue')
  await verifyPage(page, true)

  await page.getByRole('radio', { name: 'Withdrawn by staff' }).check()

  await clickButton(page, 'Continue')

  await expectPage(page, "Check and confirm who you're taking off the activity", true)

  await clickButton(page, 'Confirm and remove')

  await expectPage(page, 'Removal complete', true)

  await expect(page.locator('.govuk-panel__body')).toContainText(
    `2 prisoners are now scheduled to be removed from English level 1 on ${format(endDate, 'EEEE, d MMMM yyyy')}`,
  )
})

test('a user sees an error when they do not enter a deallocation date', async ({ page }) => {
  const activityStartDate = subDays(subWeeks(new Date(), 2), 1)

  await setupDeallocationScenario(activityStartDate)

  await page.goto('/activities/allocation-dashboard')
  await verifyPage(page, true)

  await clickLink(page, 'English level 1')
  await verifyPage(page, true)

  const currentlyAllocated = page.getByRole('table', {
    name: 'Currently allocated',
  })

  await currentlyAllocated.getByRole('row').filter({ hasText: 'G4793VF' }).getByRole('checkbox').check()

  await clickButton(page, 'End allocation')
  await verifyPage(page, true)

  await page.getByRole('radio', { name: 'On a different date' }).check()

  await clickButton(page, 'Continue')

  await expect(page.getByRole('alert')).toContainText('Enter a date')
  await verifyPage(page, true)

  await expect(page.getByLabel('Other date')).toBeVisible()
})

test('a user can change an existing allocation end date', async ({ page }) => {
  const activityStartDate = subDays(subWeeks(new Date(), 2), 1)
  const existingEndDate = addMonths(new Date(), 2)
  const newEndDate = addMonths(new Date(), 3)

  await setupDeallocationScenario(activityStartDate, existingEndDate)

  await page.goto('/activities/allocation-dashboard')

  await page.getByRole('link', { name: 'English level 1' }).click()

  const currentlyAllocated = page.getByRole('table', {
    name: 'Currently allocated',
  })

  await currentlyAllocated.getByRole('row').filter({ hasText: 'G4793VF' }).getByRole('checkbox').check()

  await page.getByRole('button', { name: 'Manage allocation' }).click()

  await expect(
    page.getByRole('heading', {
      name: 'Change allocation details for Tim Harrison (G4793VF)',
    }),
  ).toBeVisible()

  await expectSummaryRow(page, 'End of allocation', format(existingEndDate, 'd MMMM yyyy'))

  const endDateRow = page.locator('.govuk-summary-list__row').filter({
    has: page.locator('.govuk-summary-list__key').and(page.getByText('End of allocation', { exact: true })),
  })

  await endDateRow.getByRole('link', { name: 'Change' }).click()

  await page.getByRole('radio', { name: 'Change the date' }).check()
  await page.getByRole('button', { name: 'Continue' }).click()

  await page.getByRole('radio', { name: 'On a different date' }).check()
  await page.getByLabel('Other date').fill(format(newEndDate, 'dd/MM/yyyy'))

  await page.getByRole('button', { name: 'Continue' }).click()

  await page.getByRole('radio', { name: 'No' }).check()
  await page.getByRole('button', { name: 'Continue' }).click()

  await expect(
    page.getByRole('heading', {
      name: "Check and confirm who you're taking off the activity",
    }),
  ).toBeVisible()

  await expectSummaryRow(page, 'End of allocation', format(newEndDate, 'd MMMM yyyy'))

  await page.getByRole('button', { name: 'Confirm and remove' }).click()

  await expect(successBanner(page)).toContainText('You have changed the end date for this allocation')
})
