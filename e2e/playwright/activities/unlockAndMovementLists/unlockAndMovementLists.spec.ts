import { expect, test } from '@playwright/test'

import stubs from '../../../../integration_tests/mockApis/stubs'
import { resetStubs } from '../../../../integration_tests/mockApis/wiremock'

import {
  setupOutsideMovementList,
  setupUnlockList,
} from '../../helpers/activities/unlockAndMovementLists/unlockAndMovementLists'
import { signIn, signInEAEnabled } from '../../helpers/auth'
import { clickButton, clickLink } from '../../helpers/govuk'
import { expectPage } from '../../helpers/page'

test.beforeEach(async () => {
  await resetStubs()
  await stubs.stubSignIn()
})

test('a user can view the outside movement list', async ({ page }) => {
  await setupOutsideMovementList()
  await signInEAEnabled(page)

  await page.goto('/activities/unlock-list')

  await expectPage(page, 'Manage unlock and movement lists', false)

  await clickLink(page.locator('[data-qa="create-movement-lists"]'), 'Create movement lists')

  await expectPage(page, 'Choose movement list details', false)

  await page
    .getByRole('radio', {
      name: /^Today/,
    })
    .check()

  await page
    .getByRole('radio', {
      name: 'AM (morning)',
    })
    .check()

  await clickButton(page, 'Continue')

  await expectPage(page, 'Locations people are going to in this session', false)

  const outsideLocations = page.locator('[data-qa="outside-locations"]')

  await expect(outsideLocations).toContainText('Outside locations')

  await clickLink(outsideLocations, 'View movement list')

  await expect(
    page.getByRole('heading', {
      name: 'Outside - movement list',
    }),
  ).toBeVisible()

  await expect(page.locator('[data-qa="people-count"]')).toContainText('2 people going out')

  const movementTable = page.locator('[data-qa="location-prisoner-events"]')

  await expect(movementTable.getByRole('row')).toHaveCount(4)

  await expect(movementTable).toContainText('Paid work')

  await expect(movementTable).toContainText('Sentence or resettlement plan ROTL')

  await expect(movementTable).toContainText('Outside')

  await expect(movementTable).toContainText('Cancelled')
})
