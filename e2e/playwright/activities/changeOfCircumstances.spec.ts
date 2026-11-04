import { expect, test } from '@playwright/test'

import stubs from '../../../integration_tests/mockApis/stubs'
import { resetStubs, stubEndpoint } from '../../../integration_tests/mockApis/wiremock'
import getEventsForReview from '../../../integration_tests/fixtures/activitiesOrchestratorApi/getEventsForReview.json'
import { signIn } from '../helpers/auth'

const inmateDetails = [
  {
    prisonerNumber: 'A1234AA',
    cellLocation: '1-12-123',
    firstName: 'Joe',
    lastName: 'Johnson',
  },
  {
    prisonerNumber: 'A1234AB',
    cellLocation: '1-12-123',
    firstName: 'Terry',
    lastName: 'Glasvern',
  },
  {
    prisonerNumber: 'A1234AC',
    cellLocation: '1-12-123',
    firstName: 'John',
    lastName: 'Armitage',
  },
]

test.beforeEach(async ({ page }) => {
  await resetStubs()
  await stubs.stubSignIn()

  await stubEndpoint('GET', '/event-review/prison/MDI\\?date=2023-05-16&page=0&size=10', getEventsForReview)

  await stubEndpoint('POST', '/prisoner-search/prisoner-numbers', inmateDetails)

  await signIn(page)
})

test('a user can review changes in circumstances', async ({ page }) => {
  await page.goto('/activities/change-of-circumstances/view-changes?date=2023-05-16')

  await expect(page.getByRole('heading', { name: 'Changes in circumstances' })).toBeVisible()

  const bob = page.getByRole('row').filter({ hasText: 'Johnson, Joe' })

  await expect(bob).toContainText('Out of prison')
  await expect(bob).toContainText('12:17')
  await expect(bob).toContainText('Non-association')

  const terry = page.getByRole('row').filter({ hasText: 'Glasvern, Terry' })

  await expect(terry).toContainText('Out of prison')
  await expect(terry).toContainText('14:00')
  await expect(terry).toContainText('Cell-move')

  const john = page.getByRole('row').filter({ hasText: 'Armitage, John' })

  await expect(john).toContainText('Out of prison')
  await expect(john).toContainText('15:20')
  await expect(john).toContainText('Unknown-event')
})
