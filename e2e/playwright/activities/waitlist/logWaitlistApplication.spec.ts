import { expect, test } from '@playwright/test'
import { format, subDays } from 'date-fns'

import stubs from '../../../../integration_tests/mockApis/stubs'
import { resetStubs } from '../../../../integration_tests/mockApis/wiremock'
import setupLogWaitlistApplicationScenario from '../../helpers/activities/waitlist/logWaitlistApplication'
import { signIn } from '../../helpers/auth'
import { clickButton, expectHeading, expectSummaryRow } from '../../helpers/govuk'
import verifyPage from '../../helpers/page'

test.beforeEach(async ({ page }) => {
  await resetStubs()
  await stubs.stubSignIn()
  await setupLogWaitlistApplicationScenario()
  await signIn(page)
})

test('a user can log a pending waitlist application', async ({ page }) => {
  const yesterday = subDays(new Date(), 1)

  await page.goto('/activities/waitlist/2f0b204c-2d68-4c53-b581-b4d0075dd231/A1350DZ/apply')

  await expectHeading(page, 'Enter the date shown on the application')
  await verifyPage(page, true)

  await page.getByLabel('Enter the date shown on the application').fill(format(yesterday, 'dd/MM/yyyy'))
  await clickButton(page, 'Continue')

  await expectHeading(page, 'Search for the activity')
  await verifyPage(page, true)

  await page.locator('#activityId').fill('Maths level 1')
  await page.getByRole('option', { name: 'Maths level 1', exact: true }).click()
  await clickButton(page, 'Continue')

  await expectHeading(page, 'Who made the application?')
  await verifyPage(page, true)

  await page.getByRole('radio', { name: 'David Winchurch', exact: true }).check()
  await clickButton(page, 'Continue')

  await expectHeading(page, 'Record a status for this application')
  await verifyPage(page, true)

  await page.getByRole('radio', { name: /^Pending/ }).check()
  await clickButton(page, 'Continue')

  await expectHeading(page, 'Check and confirm application details')
  await verifyPage(page, true)

  await expectSummaryRow(page, 'Applicant', 'David Winchurch')
  await expectSummaryRow(page, 'Applicant', 'A1350DZ')
  await expectSummaryRow(page, 'Activity requested', 'Maths level 1')
  await expectSummaryRow(page, 'Request date', format(yesterday, 'do MMMM yyyy'))
  await expectSummaryRow(page, 'Requester', 'Self-requested')
  await expectSummaryRow(page, 'Status', 'Pending')
  await expectSummaryRow(page, 'Comment', 'None')

  await clickButton(page, 'Log activity application')

  await expectHeading(page, /You've successfully logged David Winchurch's application for Maths level 1/i)
  await verifyPage(page, true)

  await expect(page.locator('.govuk-panel__body')).toContainText('The application status is Pending')
})
