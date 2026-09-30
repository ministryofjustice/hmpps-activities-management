import { expect } from '@playwright/test'
import { format } from 'date-fns'
import screens from '../screens.json'
import test from './fixtures'
import { expectPage } from '../../helpers/page'
import { withJourney, withSessionJourney } from './journey'
import { JourneyData } from '../../../../server/@types/express'

export type Screen = (typeof screens)[number]

export const smokeArea = (
  area: string,
  setup: (screen: Screen) => Promise<unknown>,
  journey: JourneyData | ((screen: Screen) => JourneyData) = {},
  sessionJourney?: Record<string, unknown>,
  suiteTest: typeof test = test,
): void => {
  suiteTest.describe(`${area} @smoke`, () => {
    screens
      .filter(screen => screen.area === area && screen.status === 'covered')
      .forEach(screen => {
        suiteTest(screen.id, async ({ page }) => {
          await setup(screen)
          const visit = async (journeyId = '') => {
            await page.goto(
              screen.route.replace(':journeyId', journeyId).replace(':today', format(new Date(), 'yyyy-MM-dd')),
              { waitUntil: 'domcontentloaded' },
            )
            if (screen.pageId) await expect(page.locator(`[id="${screen.pageId}"]`)).toBeVisible()
            await expectPage(page, screen.heading, true, 1)
          }
          if (!screen.route.includes(':journeyId')) {
            await visit()
            return
          }
          await withJourney(typeof journey === 'function' ? journey(screen) : journey, async journeyId => {
            if (sessionJourney) await withSessionJourney(page, journeyId, sessionJourney, () => visit(journeyId))
            else await visit(journeyId)
          })
        })
      })
  })
}
