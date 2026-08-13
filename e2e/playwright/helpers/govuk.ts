import { Page } from '@playwright/test'

export const summaryRow = (page: Page, key: string) => page.locator('.govuk-summary-list__row').filter({ hasText: key })

export const successBanner = (page: Page) => page.locator('.govuk-notification-banner--success')
