import { expect, test } from '@playwright/test'

import stubs from '../../../../integration_tests/mockApis/stubs'
import { resetStubs } from '../../../../integration_tests/mockApis/wiremock'
import setupReinstateWaitlistApplicationScenario, {
  stubReinstatedWaitlistApplication,
} from '../../helpers/activities/reinstateWaitlistApplication'
import { signIn } from '../../helpers/auth'

test.beforeEach(async ({ page }) => {
  await resetStubs()
  await stubs.stubSignIn()
  await setupReinstateWaitlistApplicationScenario()
  await signIn(page)
})

test('a user can reinstate a withdrawn waitlist application', async ({ page }) => {
  const reinstateReason = 'Example reason for reinstating the application'

  await page.goto('/activities/waitlist-dashboard')

  await expect(
    page.getByRole('heading', {
      name: 'Manage applications and waitlists',
    }),
  ).toBeVisible()

  const applicationRow = page.getByRole('row').filter({ hasText: 'Winchurch, David Bob' })

  await applicationRow.getByRole('radio').check()

  await page
    .getByRole('button', {
      name: 'View or edit application',
    })
    .click()

  await expect(
    page.getByRole('heading', {
      name: 'Request for David Winchurch, A1350DZ',
    }),
  ).toBeVisible()

  const summaryRows = page.locator('.govuk-summary-list__row')

  await expect(summaryRows.filter({ hasText: 'Status' })).toContainText('Withdrawn')

  await page
    .getByRole('link', {
      name: 'Reinstate application',
    })
    .click()

  await expect(
    page.getByRole('heading', {
      name: "Are you sure you want to reinstate David Winchurch's application?",
    }),
  ).toBeVisible()

  await expect(page.getByText(/It will be reinstated as Pending/)).toBeVisible()

  await page
    .getByRole('radio', {
      name: 'Yes',
      exact: true,
    })
    .check()

  await page
    .getByRole('button', {
      name: 'Continue',
    })
    .click()

  await expect(
    page.getByRole('heading', {
      name: 'Enter the reason this application is being reinstated',
    }),
  ).toBeVisible()

  await page
    .getByRole('textbox', {
      name: 'Enter the reason this application is being reinstated',
    })
    .fill(reinstateReason)

  await stubReinstatedWaitlistApplication(reinstateReason)

  await page
    .getByRole('button', {
      name: 'Confirm and reinstate application',
    })
    .click()

  const successBanner = page.locator('.govuk-notification-banner--success')

  await expect(successBanner).toBeVisible()

  await expect(successBanner).toContainText("You have updated the status of David Winchurch's application")

  await expect(page.locator('.govuk-summary-list__row').filter({ hasText: 'Status' })).toContainText('Pending')

  await expect(page.locator('.govuk-summary-list__row').filter({ hasText: 'Comments' })).toContainText(reinstateReason)
})
