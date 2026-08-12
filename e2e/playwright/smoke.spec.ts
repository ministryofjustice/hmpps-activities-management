import { expect, test } from '@playwright/test'

import stubs from '../../integration_tests/mockApis/stubs'
import { resetStubs } from '../../integration_tests/mockApis/wiremock'
import { signIn } from './helpers/auth'

test.beforeEach(async ({ page }) => {
  await resetStubs()
  await stubs.stubSignIn()
  await signIn(page)
})

test('a user can access activities', async ({ page }) => {
  await page.locator('[data-qa="activities-card"]').click()

  await expect(page.locator('#activities-index-page')).toBeVisible()

  await page.locator('[data-qa="allocate-to-activities-card"]').click()

  await expect(page.locator('#allocate-home')).toBeVisible()

  await expect(page.locator('[data-qa="manage-allocations"]')).toContainText('Manage allocations')
})
