import { expect } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'

type RoleScope = Page | Locator

export const clickButton = (scope: RoleScope, name: string | RegExp): Promise<void> =>
  scope.getByRole('button', { name }).click()

// RoleScope could be 'Locator' which would be defined like:
// const cancelledEnglishRow = page.getByRole('row').filter({ hasText: 'English level 1' })
// with cancelledEnglishRow passed in to the below
export const clickLink = (scope: RoleScope, name: string | RegExp): Promise<void> =>
  scope.getByRole('link', { name }).click()

export const expectHeading = (scope: RoleScope, name: string | RegExp, level?: number): Promise<void> =>
  expect(scope.getByRole('heading', { name, level })).toBeVisible()

export const expectSummaryRow = (scope: RoleScope, key: string | RegExp, value: string | RegExp): Promise<void> =>
  expect(scope.locator('.govuk-summary-list__row').filter({ hasText: key })).toContainText(value)

export const successBanner = (page: Page) => page.locator('.govuk-notification-banner--success')
