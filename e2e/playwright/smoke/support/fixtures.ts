import { BrowserContext, test as base } from '@playwright/test'
import stubs from '../../../../integration_tests/mockApis/stubs'
import { resetStubs, stubEndpoint } from '../../../../integration_tests/mockApis/wiremock'
import rollout from '../../../../integration_tests/fixtures/activitiesApi/rolloutEAEnabled.json'
import { signInEAEnabled } from '../../helpers/auth'

type AuthState = Awaited<ReturnType<BrowserContext['storageState']>>

const test = base.extend<object, { smokeAuth: AuthState }>({
  smokeAuth: [
    async ({ browser }, use) => {
      await resetStubs()
      await stubs.stubSignIn()
      const context = await browser.newContext({ baseURL: 'http://localhost:3007' })
      try {
        await signInEAEnabled(await context.newPage())
        await use(await context.storageState())
      } finally {
        await context.close()
      }
    },
    { scope: 'worker' },
  ],
  storageState: async ({ smokeAuth }, use) => use(smokeAuth),
  page: async ({ page }, use) => {
    await resetStubs()
    await stubs.stubSignIn()
    await stubEndpoint('GET', '/rollout/MDI', rollout)
    await use(page)
  },
})

export default test
