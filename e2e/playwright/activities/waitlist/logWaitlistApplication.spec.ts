import { expect, test } from '@playwright/test'
import { format, subDays } from 'date-fns'

import stubs from '../../../../integration_tests/mockApis/stubs'
import { resetStubs } from '../../../../integration_tests/mockApis/wiremock'
import setupLogWaitlistApplicationScenario from '../../helpers/activities/waitlist/logWaitlistApplication'
import { signIn } from '../../helpers/auth'

test.beforeEach(async ({ page }) => {
  await resetStubs()
  await stubs.stubSignIn()
  await setupLogWaitlistApplicationScenario()
  await signIn(page)
})

test('a user can log a pending waitlist application', async ({ page }) => {
  const yesterday = subDays(new Date(), 1)

  await page.goto('/activities/waitlist/2f0b204c-2d68-4c53-b581-b4d0075dd231/A1350DZ/apply')

  await expect(
    page.getByRole('heading', {
      name: 'Enter the date shown on the application',
    }),
  ).toBeVisible()

  await page.getByLabel('Enter the date shown on the application').fill(format(yesterday, 'dd/MM/yyyy'))
  await page.getByRole('button', { name: 'Continue' }).click()

  await expect(page.getByRole('heading', { name: 'Search for the activity' })).toBeVisible()

  await page.locator('#activityId').fill('Maths level 1')
  await page.getByRole('option', { name: 'Maths level 1', exact: true }).click()
  await page.getByRole('button', { name: 'Continue' }).click()

  await expect(page.getByRole('heading', { name: 'Who made the application?' })).toBeVisible()

  await page.getByRole('radio', { name: 'David Winchurch', exact: true }).check()
  await page.getByRole('button', { name: 'Continue' }).click()

  await expect(
    page.getByRole('heading', {
      name: 'Record a status for this application',
    }),
  ).toBeVisible()

  await page.getByRole('radio', { name: /^Pending/ }).check()
  await page.getByRole('button', { name: 'Continue' }).click()

  await expect(
    page.getByRole('heading', {
      name: 'Check and confirm application details',
    }),
  ).toBeVisible()

  const summaryRows = page.locator('.govuk-summary-list__row')

  await expect(summaryRows.filter({ hasText: 'Applicant' })).toContainText('David Winchurch')
  await expect(summaryRows.filter({ hasText: 'Applicant' })).toContainText('A1350DZ')
  await expect(summaryRows.filter({ hasText: 'Activity requested' })).toContainText('Maths level 1')
  await expect(summaryRows.filter({ hasText: 'Request date' })).toContainText(format(yesterday, 'do MMMM yyyy'))
  await expect(summaryRows.filter({ hasText: 'Requester' })).toContainText('Self-requested')
  await expect(summaryRows.filter({ hasText: 'Status' })).toContainText('Pending')
  await expect(summaryRows.filter({ hasText: 'Comment' })).toContainText('None')

  await page.getByRole('button', { name: 'Log activity application' }).click()

  await expect(
    page.getByRole('heading', {
      name: /You've successfully logged David Winchurch's application for Maths level 1/i,
    }),
  ).toBeVisible()

  await expect(page.locator('.govuk-panel__body')).toContainText('The application status is Pending')
})
