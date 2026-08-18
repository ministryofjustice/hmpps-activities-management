import { expect, Page } from '@playwright/test'

import stubs from '../../../integration_tests/mockApis/stubs'
import { stubEndpoint } from '../../../integration_tests/mockApis/wiremock'

import rolloutPlan from '../../../integration_tests/fixtures/activitiesApi/rollout.json'
import rolloutPlanEAEnabled from '../../../integration_tests/fixtures/activitiesApi/rolloutEAEnabled.json'

export const signIn = async (page: Page): Promise<void> => {
  await page.goto('/')

  await expect(page.locator('#sign-in-page')).toBeVisible()

  await stubEndpoint('GET', '/rollout/MDI', rolloutPlan)

  const signInUrl = await stubs.getSignInUrl()

  await page.goto(signInUrl)

  await expect(page.locator('#index-page')).toBeVisible()
}

export const signInEAEnabled = async (page: Page): Promise<void> => {
  await page.goto('/')

  await expect(page.locator('#sign-in-page')).toBeVisible()

  await stubEndpoint('GET', '/rollout/MDI', rolloutPlanEAEnabled)

  const signInUrl = await stubs.getSignInUrl()

  await page.goto(signInUrl)

  await expect(page.locator('#index-page')).toBeVisible()
}
