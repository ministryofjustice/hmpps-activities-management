import { expect, test } from '@playwright/test'
import { addMonths, format } from 'date-fns'

import stubs from '../../../../integration_tests/mockApis/stubs'
import { resetStubs } from '../../../../integration_tests/mockApis/wiremock'
import { signInEAEnabled } from '../../helpers/auth'
import stubAllocateMultipleToExternalActivity from '../../helpers/activities/allocations/allocateMultipleToExternalActivity'
import { clickButton, clickLink } from '../../helpers/govuk'
import verifyPage, { expectPage } from '../../helpers/page'

test.beforeEach(async ({ page }) => {
  await resetStubs()
  await stubs.stubSignIn()
  await stubAllocateMultipleToExternalActivity()
  await signInEAEnabled(page)
})

test('a user can allocate multiple people to an externally paid activity', async ({ page }) => {
  await page.goto('/activities/allocation-dashboard/4')

  await expectPage(page, 'Hotel', true)

  await page.getByRole('tab', { name: 'Other people' }).click()
  await clickLink(page, /allocate a group of people/i)
  await verifyPage(page, true)

  await page.locator('input[name="howToAdd"][value="SEARCH"]').check()
  await clickButton(page, 'Continue')
  await verifyPage(page, true)

  const selectPrisoner = async (prisonerNumber: string) => {
    await page.locator('input[name="query"]').fill('s')
    await clickButton(page, 'Search')
    await verifyPage(page, true)
    await page.locator(`input[name="selectedPrisoner"][value="${prisonerNumber}"]`).check()
    await clickButton(page, 'Select and continue')
    await verifyPage(page, true)
  }

  await selectPrisoner('A1350DZ')

  await clickButton(page, 'Add another person')
  await verifyPage(page, true)
  await selectPrisoner('A8644DY')

  await clickButton(page, 'Add another person')
  await verifyPage(page, true)
  await selectPrisoner('A1351DZ')

  await expect(page.locator('[data-qa="prisoner-list"] tbody tr')).toHaveCount(3)
  await clickButton(page, 'Continue')
  await verifyPage(page, true)

  const startDate = addMonths(new Date(), 1)

  await page.getByRole('radio', { name: 'A different date' }).check()
  await page.locator('#startDate').fill(format(startDate, 'dd/MM/yyyy'))
  await clickButton(page, 'Continue')
  await verifyPage(page, true)

  await page.getByRole('radio', { name: 'Yes' }).check()
  await clickButton(page, 'Continue')
  await verifyPage(page, true)

  const endDate = addMonths(new Date(), 8)

  await page.locator('#endDate').fill(format(endDate, 'dd/MM/yyyy'))
  await clickButton(page, 'Continue')

  await expectPage(page, 'Check and confirm 3 allocations', true)
  await expect(page.locator('[data-qa="prisoner-pay-list"]')).toHaveCount(0)

  const outsideLocation = page.locator('.govuk-summary-list__value').filter({
    hasText: 'Outside',
  })

  await expect(outsideLocation).toHaveText('Outside')

  await clickButton(page, 'Confirm 3 allocations')

  await expectPage(page, 'Allocations complete', true)
  await expect(page.locator('.govuk-panel__body')).toContainText('3 people are now allocated to Hotel')

  await page.locator('[data-qa="activity-page-link"]').click()
  await expect(page).toHaveURL(/\/activities\/allocation-dashboard\/4$/)
  await verifyPage(page, true)

  await page.goBack()
  await verifyPage(page, true)

  await page.locator('[data-qa="allocations-dash-link"]').click()
  await expect(page).toHaveURL(/\/activities\/allocation-dashboard$/)
  await verifyPage(page, true)
})
