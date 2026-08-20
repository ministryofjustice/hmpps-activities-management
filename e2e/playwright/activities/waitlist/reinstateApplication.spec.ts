import { expect, test } from '@playwright/test'

import stubs from '../../../../integration_tests/mockApis/stubs'
import { resetStubs } from '../../../../integration_tests/mockApis/wiremock'
import setupReinstateWaitlistApplicationScenario, {
  stubReinstatedWaitlistApplication,
} from '../../helpers/activities/waitlist/reinstateWaitlistApplication'
import { signIn } from '../../helpers/auth'
import { clickButton, clickLink, expectHeading, expectSummaryRow, successBanner } from '../../helpers/govuk'
import verifyPage from '../../helpers/page'

test.beforeEach(async ({ page }) => {
  await resetStubs()
  await stubs.stubSignIn()
  await setupReinstateWaitlistApplicationScenario()
  await signIn(page)
})

test('a user can reinstate a withdrawn waitlist application', async ({ page }) => {
  const reinstateReason = 'Example reason for reinstating the application'

  await page.goto('/activities/waitlist-dashboard')

  await expectHeading(page, 'Manage applications and waitlists')
  await verifyPage(page, true)

  const applicationRow = page.getByRole('row').filter({ hasText: 'Winchurch, David Bob' })

  await applicationRow.getByRole('radio').check()

  await clickButton(page, 'View or edit application')

  await expectHeading(page, 'Request for David Winchurch, A1350DZ')
  await verifyPage(page, true)

  await expectSummaryRow(page, 'Status', 'Withdrawn')

  await clickLink(page, 'Reinstate application')

  await expectHeading(page, "Are you sure you want to reinstate David Winchurch's application?")
  await verifyPage(page, true)

  await expect(page.getByText(/It will be reinstated as Pending/)).toBeVisible()

  await page
    .getByRole('radio', {
      name: 'Yes',
      exact: true,
    })
    .check()

  await clickButton(page, 'Continue')

  await expectHeading(page, 'Enter the reason this application is being reinstated')
  await verifyPage(page, true)

  await page
    .getByRole('textbox', {
      name: 'Enter the reason this application is being reinstated',
    })
    .fill(reinstateReason)

  await stubReinstatedWaitlistApplication(reinstateReason)

  await clickButton(page, 'Confirm and reinstate application')

  const banner = successBanner(page)

  await expect(banner).toBeVisible()
  await verifyPage(page, true)
  await expect(banner).toContainText("You have updated the status of David Winchurch's application")

  await expectSummaryRow(page, 'Status', 'Pending')
  await expectSummaryRow(page, 'Comments', reinstateReason)
})
