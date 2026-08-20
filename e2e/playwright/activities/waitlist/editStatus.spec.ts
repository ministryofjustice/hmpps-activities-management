import { expect, test } from '@playwright/test'

import stubs from '../../../../integration_tests/mockApis/stubs'
import { resetStubs } from '../../../../integration_tests/mockApis/wiremock'
import setupEditWaitlistStatusScenario, {
  stubApprovedWaitlistApplication,
} from '../../helpers/activities/waitlist/editWaitlistStatus'
import { signIn } from '../../helpers/auth'
import { clickButton, clickLink, expectHeading, expectSummaryRow } from '../../helpers/govuk'
import verifyPage from '../../helpers/page'

test.beforeEach(async ({ page }) => {
  await resetStubs()
  await stubs.stubSignIn()
  await setupEditWaitlistStatusScenario()
  await signIn(page)
})

test('a user can view a pending waitlist application and change its status to approved', async ({ page }) => {
  await page.goto('/activities/waitlist-dashboard')

  await expectHeading(page, 'Manage applications and waitlists')
  await verifyPage(page, true)

  const applicationRow = page.getByRole('row').filter({ hasText: 'Winchurch, David Bob' })

  await expect(applicationRow).toContainText('Maths level 1')
  await expect(applicationRow).toContainText('20 June 2025')
  await expect(applicationRow).toContainText('Self-requested')
  await expect(applicationRow).toContainText('25 December 2023')
  await expect(applicationRow).toContainText('Pending')

  await applicationRow.getByRole('radio').check()

  await clickButton(page, 'View or edit application')

  await expectHeading(page, 'Request for David Winchurch, A1350DZ')
  await verifyPage(page, true)

  await expectSummaryRow(page, 'Status', 'Pending')
  await expectSummaryRow(page, 'Status', 'Last changed 20th June 2025 14:22')
  await expectSummaryRow(page, 'Activity requested', 'A basic english course suitable for introduction to the subject')
  await expectSummaryRow(page, 'Requester', 'Self-requested')
  await expectSummaryRow(page, 'Date of request', '20th June 2025')
  await expectSummaryRow(page, 'Comments', 'None')

  await page
    .getByRole('tab', {
      name: 'Application history',
    })
    .click()
  await verifyPage(page, true)

  await expect(
    page.locator('.moj-timeline__title').filter({
      hasText: 'Application logged',
    }),
  ).toBeVisible()

  await page
    .getByRole('tab', {
      name: 'Application details',
    })
    .click()

  await clickLink(page, 'Change status')

  await expectHeading(page, "Change the status of David Winchurch's application")
  await verifyPage(page, true)

  await expect(page.locator('.govuk-inset-text')).toContainText('Pending')

  await page
    .getByRole('radio', {
      name: /^Approved/,
    })
    .check()

  await stubApprovedWaitlistApplication()

  await clickButton(page, 'Update application status')

  const successBanner = page.locator('.govuk-notification-banner--success')

  await expect(successBanner).toBeVisible()
  await verifyPage(page, true)

  await expect(successBanner).toContainText("You have updated the status of David Winchurch's application")

  await expectSummaryRow(page, 'Status', 'Approved')
})
