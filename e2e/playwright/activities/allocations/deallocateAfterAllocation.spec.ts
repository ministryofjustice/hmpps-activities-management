import { test } from '@playwright/test'
import { format } from 'date-fns'

import { signIn } from '../../helpers/auth'
import setupDeallocateAfterAllocationScenario from '../../helpers/activities/allocations/deallocateAfterAllocation'
import stubs from '../../../../integration_tests/mockApis/stubs'
import { resetStubs } from '../../../../integration_tests/mockApis/wiremock'
import { clickButton, clickLink, expectHeading, expectSummaryRow } from '../../helpers/govuk'
import verifyPage from '../../helpers/page'

test.beforeEach(async ({ page }) => {
  await resetStubs()
  await stubs.stubSignIn()
  await setupDeallocateAfterAllocationScenario()
  await signIn(page)
})

test('a user can deallocate from another activity immediately after making an allocation', async ({ page }) => {
  await page.goto('/activities/allocation-dashboard/2')
  await verifyPage(page, true)

  await page.getByRole('tab', { name: 'Entry level English 1 schedule' }).click()
  await page.getByRole('tab', { name: 'Other people' }).click()

  const otherPeopleTab = page.getByRole('tabpanel', { name: 'Other people' })

  await otherPeopleTab.locator('#riskLevelFilter').selectOption('Any Workplace Risk Assessment')

  await clickButton(otherPeopleTab, 'Apply filters')
  await verifyPage(page, true)

  await otherPeopleTab.getByRole('radio', { name: 'Select Alfonso Cholak' }).check()

  await clickButton(otherPeopleTab, 'Allocate')
  await verifyPage(page, true)

  await page.getByRole('radio', { name: 'Yes' }).check()
  await clickButton(page, 'Continue')
  await verifyPage(page, true)

  await page.getByRole('radio', { name: /^The next session/ }).check()
  await clickButton(page, 'Continue')
  await verifyPage(page, true)

  await page.getByRole('radio', { name: 'No' }).check()
  await clickButton(page, 'Continue')
  await verifyPage(page, true)

  await page.getByRole('radio', { name: 'Medium - £1.75' }).check()
  await clickButton(page, 'Continue')
  await verifyPage(page, true)

  await clickButton(page, 'Continue')
  await verifyPage(page, true)

  await clickButton(page, 'Confirm this allocation')

  await expectHeading(page, 'Allocation complete')
  await verifyPage(page, true)

  await clickLink(page, 'take Alfonso Cholak off Maths level 1')
  await verifyPage(page, true)

  await page.getByRole('radio', { name: 'At the end of today' }).check()
  await clickButton(page, 'Continue')
  await verifyPage(page, true)

  await page.getByRole('radio', { name: 'Completed course or task' }).check()

  await clickButton(page, 'Continue')
  await verifyPage(page, true)

  await expectSummaryRow(page, 'Activity', 'Maths level 1')
  await expectSummaryRow(page, 'End of allocation', format(new Date(), 'd MMMM yyyy'))
  await expectSummaryRow(page, 'Reason for allocation ending', 'Completed course or task')

  await clickButton(page, 'Confirm and remove')

  await expectHeading(page, 'Removal complete')
  await verifyPage(page, true)
})
