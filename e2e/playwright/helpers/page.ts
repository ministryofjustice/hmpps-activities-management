import { expect, Page, test } from '@playwright/test'
import * as axe from 'axe-core'
import { expectHeading } from './govuk'

const accessibilityOptions: axe.RunOptions = {
  rules: {
    // Exceptions set to legacy Cypress standards.
    // aria-allowed-attr is disabled because radio buttons can have aria-expanded which isn't
    // currently allowed by the spec, but that might change: https://github.com/w3c/aria/issues/1404
    'aria-allowed-attr': { enabled: false },
    // Colour contrast is covered separately because Axe cannot reliably determine it in CI.
    'color-contrast': { enabled: false },
  },
}

const formatViolations = (violations: axe.Result[]): string =>
  violations
    .flatMap(violation => [
      `${violation.id} (${violation.impact ?? 'unknown impact'}): ${violation.help}`,
      ...violation.nodes.map(node => `  ${node.target.join(' ')}: ${node.failureSummary ?? node.html}`),
    ])
    .join('\n')

/**
 * Confirms that the current page has rendered. If checkAccessibility = true, Axe accessibility checks run.
 */
const verifyPage = async (page: Page, checkAccessibility: boolean): Promise<void> => {
  const accessibilityStep = checkAccessibility ? ' and is accessible' : ''

  await test.step(`verify ${new URL(page.url()).pathname} renders${accessibilityStep}`, async () => {
    await expect(page).toHaveTitle(/\S/)
    await expect(page.locator('main#main-content')).toBeVisible()
    await expect(page.locator('h1').first()).toBeVisible()
    await expect(page.locator('pre.stacktrace')).toHaveCount(0)

    if (!checkAccessibility) return

    await page.evaluate(axe.source)

    const results = await page.evaluate(async options => {
      const browser = globalThis as unknown as {
        axe: {
          run: (context: unknown, runOptions: axe.RunOptions) => Promise<axe.AxeResults>
        }
        document: unknown
      }

      return browser.axe.run(browser.document, options as axe.RunOptions)
    }, accessibilityOptions)

    if (results.violations.length > 0) {
      await test.info().attach('accessibility-violations', {
        body: Buffer.from(JSON.stringify(results.violations, null, 2)),
        contentType: 'application/json',
      })
    }

    expect(results.violations, `Accessibility violations:\n${formatViolations(results.violations)}`).toEqual([])
  })
}

export const expectPage = async (page: Page, heading: string | RegExp, checkAccessibility: boolean): Promise<void> => {
  await expectHeading(page, heading)
  await verifyPage(page, checkAccessibility)
}

export default verifyPage
