import path from 'path'
import { addMonths, format } from 'date-fns'
import { expect, test } from '@playwright/test'
import { signIn } from '../../helpers/auth'
import stubAllocateMultipleFromCsv from '../../helpers/activities/allocations/allocateMultipleFromCsv'
import stubs from '../../../../integration_tests/mockApis/stubs'
import { resetStubs } from '../../../../integration_tests/mockApis/wiremock'
import { clickButton, clickLink, expectHeading } from '../../helpers/govuk'
import verifyPage, { expectPage } from '../../helpers/page'

test.describe('Allocate multiple people via CSV', () => {
  test.beforeEach(async ({ page }) => {
    await resetStubs()
    await stubs.stubSignIn()
    await stubAllocateMultipleFromCsv()
    await signIn(page)
  })

  test('allocates multiple people to a paid activity using a CSV file', async ({ page }) => {
    await page.goto('/activities/allocation-dashboard/2')

    await expectPage(page, 'Entry level English 1', true)

    await page.getByRole('tab', { name: 'Other people' }).click()
    await clickLink(page, 'allocate a group of people')
    await verifyPage(page, true)

    await page.getByRole('radio', { name: 'Add a group of people using a CSV file' }).check()

    await clickButton(page, 'Continue')

    await expect(page.getByText('Entry level English 1', { exact: true })).toBeVisible()
    await verifyPage(page, true)

    await page
      .getByLabel('Upload your list of prison numbers')
      .setInputFiles(
        path.join(process.cwd(), 'integration_tests/fixtures/fileUpload/upload-prisoner-list-two-not-found.csv'),
      )

    await clickButton(page, 'Upload file')

    await expectPage(page, "Review who you're allocating", true)

    await expect(page.locator('[data-qa="inmate-list"] tbody tr')).toHaveCount(2)

    await expectHeading(page, 'Some prison numbers in your CSV file could not be used')

    await expect(page.locator('.govuk-list--bullet')).toContainText('NOTFOUND1')
    await expect(page.locator('.govuk-list--bullet')).toContainText('NOTFOUND2')

    await clickButton(page, 'Continue')

    await expectPage(page, 'Review 2 people who do not meet activity requirements', true)

    await clickButton(page, 'Continue')
    await verifyPage(page, true)

    await page.getByRole('radio', { name: /^The next session/ }).check()
    await clickButton(page, 'Continue')
    await verifyPage(page, true)

    await page.getByRole('radio', { name: 'Yes' }).check()
    await clickButton(page, 'Continue')
    await verifyPage(page, true)

    const endDate = format(addMonths(new Date(), 8), 'dd/MM/yyyy')

    await page.locator('#endDate').fill(endDate)
    await clickButton(page, 'Continue')

    await expectPage(page, 'Select the pay rate for 2 people', true)

    await page
      .getByRole('group', {
        name: /Select an enhanced incentive level pay rate for Stephen Gregs/i,
      })
      .getByRole('radio', { name: 'Medium - £2.00' })
      .check()

    await page
      .getByRole('group', {
        name: /Select an enhanced incentive level pay rate for John Smith/i,
      })
      .getByRole('radio', { name: 'Medium - £2.00' })
      .check()

    await clickButton(page, 'Continue')

    await expectPage(page, 'Check and confirm 2 allocations', true)

    await expect(page.locator('[data-qa="prisoner-pay-list"] tbody tr')).toHaveCount(2)

    await clickButton(page, 'Confirm 2 allocations')

    await expectPage(page, 'Allocations complete', true)

    await expect(page.locator('.govuk-panel__body')).toContainText(
      '2 people are now allocated to Entry level English 1',
    )
  })
})
