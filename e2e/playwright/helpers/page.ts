import { expect, Page, test } from '@playwright/test'
import * as axe from 'axe-core'

const accessibilityOptions: axe.RunOptions = {
  rules: {
    // These exceptions match the existing Cypress accessibility checks. aria-expanded on
    // radio buttons is used by GOV.UK Frontend and is being discussed by the ARIA working group.
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
 * Confirms that the current page has rendered its standard layout, then runs the same Axe
 * accessibility checks as the Cypress page objects.
 */
const verifyPage = async (page: Page): Promise<void> => {
  await test.step(`verify ${new URL(page.url()).pathname} renders and is accessible`, async () => {
    await expect(page).toHaveTitle(/\S/)
    await expect(page.locator('main#main-content')).toBeVisible()
    await expect(page.locator('h1').first()).toBeVisible()
    await expect(page.locator('pre.stacktrace')).toHaveCount(0)

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

export default verifyPage
