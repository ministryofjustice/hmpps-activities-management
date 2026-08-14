import { expect, test } from '@playwright/test'
import { format } from 'date-fns'

import stubs from '../../../../integration_tests/mockApis/stubs'
import { resetStubs } from '../../../../integration_tests/mockApis/wiremock'
import { signIn } from '../../helpers/auth'
import setupDeallocateAfterAllocationScenario from '../../helpers/activities/allocations/deallocateAfterAllocation'

test.beforeEach(async ({ page }) => {
  await resetStubs()
  await stubs.stubSignIn()
  await setupDeallocateAfterAllocationScenario()
  await signIn(page)
})

test('a user can deallocate from another activity immediately after making an allocation', async ({ page }) => {
  await page.goto('/activities/allocation-dashboard/2')

  await page.getByRole('tab', { name: 'Entry level English 1 schedule' }).click()
  await page.getByRole('tab', { name: 'Other people' }).click()

  const otherPeopleTab = page.getByRole('tabpanel', { name: 'Other people' })

  await otherPeopleTab.locator('#riskLevelFilter').selectOption('Any Workplace Risk Assessment')

  await otherPeopleTab.getByRole('button', { name: 'Apply filters' }).click()

  await otherPeopleTab.getByRole('radio', { name: 'Select Alfonso Cholak' }).check()

  await otherPeopleTab.getByRole('button', { name: 'Allocate' }).click()

  await page.getByRole('radio', { name: 'Yes' }).check()
  await page.getByRole('button', { name: 'Continue' }).click()

  await page.getByRole('radio', { name: /^The next session/ }).check()
  await page.getByRole('button', { name: 'Continue' }).click()

  await page.getByRole('radio', { name: 'No' }).check()
  await page.getByRole('button', { name: 'Continue' }).click()

  await page.getByRole('radio', { name: 'Medium - £1.75' }).check()
  await page.getByRole('button', { name: 'Continue' }).click()

  await page.getByRole('button', { name: 'Continue' }).click()

  await page.getByRole('button', { name: 'Confirm this allocation' }).click()

  await expect(page.getByRole('heading', { name: 'Allocation complete' })).toBeVisible()

  await page.getByRole('link', { name: 'take Alfonso Cholak off Maths level 1' }).click()

  await page.getByRole('radio', { name: 'At the end of today' }).check()
  await page.getByRole('button', { name: 'Continue' }).click()

  await page.getByRole('radio', { name: 'Completed course or task' }).check()

  await page.getByRole('button', { name: 'Continue' }).click()

  const summaryRows = page.locator('.govuk-summary-list__row')

  await expect(summaryRows.filter({ hasText: 'Activity' })).toContainText('Maths level 1')

  await expect(summaryRows.filter({ hasText: 'End of allocation' })).toContainText(format(new Date(), 'd MMMM yyyy'))

  await expect(summaryRows.filter({ hasText: 'Reason for allocation ending' })).toContainText(
    'Completed course or task',
  )

  await page.getByRole('button', { name: 'Confirm and remove' }).click()

  await expect(page.getByRole('heading', { name: 'Removal complete' })).toBeVisible()
})
