import { expect, test } from '@playwright/test'
import { addMonths, format, subDays, subWeeks } from 'date-fns'
import stubs from '../../../../integration_tests/mockApis/stubs'
import { resetStubs } from '../../../../integration_tests/mockApis/wiremock'
import { signIn } from '../../helpers/auth'
import setupDeallocationScenario from '../../helpers/activities/deallocation'

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

  await page.getByRole('link', { name: 'English level 1' }).click()

  const currentlyAllocated = page.getByRole('table', {
    name: 'Currently allocated',
  })

  await currentlyAllocated.getByRole('row').filter({ hasText: 'G4793VF' }).getByRole('checkbox').check()

  await currentlyAllocated.getByRole('row').filter({ hasText: 'A1351DZ' }).getByRole('checkbox').check()

  await page.getByRole('button', { name: 'End allocation' }).click()

  await page.getByRole('radio', { name: 'On a different date' }).check()

  await page.getByLabel('Other date').fill(format(endDate, 'dd/MM/yyyy'))

  await page.getByRole('button', { name: 'Continue' }).click()

  await page.getByRole('radio', { name: 'Withdrawn by staff' }).check()

  await page.getByRole('button', { name: 'Continue' }).click()

  await expect(
    page.getByRole('heading', {
      name: "Check and confirm who you're taking off the activity",
    }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Confirm and remove' }).click()

  await expect(page.getByRole('heading', { name: 'Removal complete' })).toBeVisible()

  await expect(page.locator('.govuk-panel__body')).toContainText(
    `2 prisoners are now scheduled to be removed from English level 1 on ${format(endDate, 'EEEE, d MMMM yyyy')}`,
  )
})

test('a user sees an error when they do not enter a deallocation date', async ({ page }) => {
  const activityStartDate = subDays(subWeeks(new Date(), 2), 1)

  await setupDeallocationScenario(activityStartDate)

  await page.goto('/activities/allocation-dashboard')

  await page.getByRole('link', { name: 'English level 1' }).click()

  const currentlyAllocated = page.getByRole('table', {
    name: 'Currently allocated',
  })

  await currentlyAllocated.getByRole('row').filter({ hasText: 'G4793VF' }).getByRole('checkbox').check()

  await page.getByRole('button', { name: 'End allocation' }).click()

  await page.getByRole('radio', { name: 'On a different date' }).check()

  await page.getByRole('button', { name: 'Continue' }).click()

  await expect(page.getByRole('alert')).toContainText('Enter a date')

  await expect(page.getByLabel('Other date')).toBeVisible()
})
