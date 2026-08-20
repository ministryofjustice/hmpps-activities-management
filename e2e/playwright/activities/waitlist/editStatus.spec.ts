import { expect, test } from '@playwright/test'

import stubs from '../../../../integration_tests/mockApis/stubs'
import { resetStubs } from '../../../../integration_tests/mockApis/wiremock'
import setupEditWaitlistStatusScenario, {
  stubApprovedWaitlistApplication,
} from '../../helpers/activities/waitlist/editWaitlistStatus'
import { signIn } from '../../helpers/auth'
import { summaryRow } from '../../helpers/govuk'
import verifyPage from '../../helpers/page'

test.beforeEach(async ({ page }) => {
  await resetStubs()
  await stubs.stubSignIn()
  await setupEditWaitlistStatusScenario()
  await signIn(page)
})

test('a user can view a pending waitlist application and change its status to approved', async ({ page }) => {
  await page.goto('/activities/waitlist-dashboard')

  await expect(
    page.getByRole('heading', {
      name: 'Manage applications and waitlists',
    }),
  ).toBeVisible()
  await verifyPage(page, true)

  const applicationRow = page.getByRole('row').filter({ hasText: 'Winchurch, David Bob' })

  await expect(applicationRow).toContainText('Maths level 1')
  await expect(applicationRow).toContainText('20 June 2025')
  await expect(applicationRow).toContainText('Self-requested')
  await expect(applicationRow).toContainText('25 December 2023')
  await expect(applicationRow).toContainText('Pending')

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
  await verifyPage(page, true)

  const summaryRows = page.locator('.govuk-summary-list__row')

  const statusRow = summaryRows.filter({ hasText: 'Status' })

  await expect(statusRow).toContainText('Pending')
  await expect(statusRow).toContainText('Last changed 20th June 2025 14:22')

  await expect(summaryRows.filter({ hasText: 'Activity requested' })).toContainText(
    'A basic english course suitable for introduction to the subject',
  )

  await expect(summaryRows.filter({ hasText: 'Requester' })).toContainText('Self-requested')

  await expect(summaryRows.filter({ hasText: 'Date of request' })).toContainText('20th June 2025')

  await expect(summaryRows.filter({ hasText: 'Comments' })).toContainText('None')

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

  await page
    .getByRole('link', {
      name: 'Change status',
    })
    .click()

  await expect(
    page.getByRole('heading', {
      name: "Change the status of David Winchurch's application",
    }),
  ).toBeVisible()
  await verifyPage(page, true)

  await expect(page.locator('.govuk-inset-text')).toContainText('Pending')

  await page
    .getByRole('radio', {
      name: /^Approved/,
    })
    .check()

  await stubApprovedWaitlistApplication()

  await page
    .getByRole('button', {
      name: 'Update application status',
    })
    .click()

  const successBanner = page.locator('.govuk-notification-banner--success')

  await expect(successBanner).toBeVisible()
  await verifyPage(page, true)

  await expect(successBanner).toContainText("You have updated the status of David Winchurch's application")

  await expect(summaryRow(page, 'Status')).toContainText('Approved')
})
