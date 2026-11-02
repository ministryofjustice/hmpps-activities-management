import { expect, test } from '@playwright/test'

import stubs from '../../../integration_tests/mockApis/stubs'
import { resetStubs, stubEndpoint, stubFor } from '../../../integration_tests/mockApis/wiremock'
import getChangeEvents from '../../../integration_tests/fixtures/activitiesApi/getChangeEvents.json'
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

  await stubEndpoint(
    'GET',
    '/event-review/v2/prison/MDI\\?date=2023-05-16&page=0&size=10&filterAcknowledged=false&sortDirection=ascending',
    getChangeEvents,
  )

  await stubEndpoint('POST', '/prisoner-search/prisoner-numbers', inmateDetails)

  await signIn(page)
})

test('a user can review changes in circumstances', async ({ page }) => {
  await page.goto('/activities/change-of-circumstances/view-changes?date=2023-05-16')

  await expect(page.getByRole('heading', { name: 'Changes to review', exact: true })).toBeVisible()

  const bob = page.getByRole('row').filter({ hasText: 'Johnson, Joe' })

  await expect(bob).toContainText('Out of prison')
  await expect(bob).toContainText('12:17')
  await expect(bob).toContainText('Non-association')

  const terry = page.getByRole('row').filter({ hasText: 'Glasvern, Terry' })

  await expect(terry).toContainText('Out of prison')
  await expect(terry).toContainText('14:00')
  await expect(terry).toContainText('Cell move')

  const john = page.getByRole('row').filter({ hasText: 'Armitage, John' })

  await expect(john).toContainText('Out of prison')
  await expect(john).toContainText('15:20')
  await expect(john).toContainText('Cell move')
})

test('a user can switch to reviewed changes without selection controls', async ({ page }) => {
  await stubEndpoint(
    'GET',
    '/event-review/v2/prison/MDI\\?date=2023-05-16&page=0&size=10&filterAcknowledged=true&sortDirection=ascending',
    {
      ...getChangeEvents,
      content: getChangeEvents.content.map(event => ({
        ...event,
        acknowledgedBy: 'REVIEWER1',
        acknowledgedTime: '2023-05-16T16:00:00',
      })),
    },
  )
  await page.goto('/activities/change-of-circumstances/view-changes?date=2023-05-16')
  await page.getByRole('link', { name: 'Changes that have been reviewed', exact: true }).click()
  await expect(page).toHaveURL(/reviewed=true/)
  await expect(page.getByRole('columnheader', { name: 'Reviewed by' })).toBeVisible()
  await expect(page.locator('tbody')).toContainText('REVIEWER1')
  await expect(page.locator('tbody input[type="checkbox"]')).toHaveCount(0)
  await page.getByRole('link', { name: 'Changes to review', exact: true }).click()
  await expect(page.locator('tbody input[type="checkbox"]')).toHaveCount(3)
})

test('Continue from date selection opens the selected date and sortable changes table', async ({ page }) => {
  await page.goto('/activities/change-of-circumstances/select-period')
  await page.getByRole('radio', { name: 'A different date' }).check()
  await page.locator('#date').fill('16/05/2023')
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Changes to review', exact: true })).toBeVisible()
  await expect(page.getByText('Tuesday, 16 May 2023', { exact: true })).toBeVisible()
  const timeHeader = page.getByRole('columnheader', { name: 'Time' })
  await expect(timeHeader).toHaveAttribute('aria-sort', 'ascending')
  await timeHeader.getByRole('button').click()
  await expect(timeHeader).toHaveAttribute('aria-sort', 'descending')
  await expect(page.locator('tbody tr').first()).toContainText('15:20')
  await page.getByRole('columnheader', { name: 'Change', exact: true }).getByRole('button').click()
  await expect(page.locator('tbody tr').first()).toContainText('Cell move')
  await page.getByRole('columnheader', { name: 'Prisoner', exact: true }).getByRole('button').click()
  await expect(page.locator('tbody tr').first()).toContainText('Armitage, John')
  await expect(page.getByRole('columnheader', { name: 'Details' }).getByRole('button')).toHaveCount(0)
  await expect(page.getByRole('columnheader', { name: 'Allocations' }).getByRole('button')).toHaveCount(0)
})

test('filters persist across tabs, and Apply and Clear retain the reviewed tab', async ({ page }) => {
  const eventCodes = 'prisoner-offender-search.prisoner.updated,prison-offender-events.prisoner.cell.move'
  await Promise.all(
    [false, true].map(reviewed =>
      stubFor({
        request: {
          method: 'GET',
          urlPath: '/event-review/v2/prison/MDI',
          queryParameters: {
            date: { equalTo: '2023-05-16' },
            prisonerNumbers: { equalTo: 'A1234AA' },
            eventCodes: { equalTo: eventCodes },
            filterAcknowledged: { equalTo: String(reviewed) },
          },
        },
        response: {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          jsonBody: {
            content: [
              {
                ...getChangeEvents.content[1],
                prisonerNumber: 'A1234AA',
                acknowledgedBy: reviewed ? 'REVIEWER1' : null,
              },
            ],
            totalElements: 1,
            totalPages: 1,
            pageNumber: 0,
          },
        },
      }),
    ),
  )
  await stubEndpoint(
    'GET',
    '/event-review/v2/prison/MDI\\?date=2023-05-16&page=0&size=10&filterAcknowledged=true&sortDirection=ascending',
    {
      content: [],
      totalElements: 0,
      totalPages: 0,
      pageNumber: 0,
    },
  )
  await page.goto(
    '/activities/change-of-circumstances/view-changes?date=2023-05-16&searchTerm=A1234AA&changeTypes=cell-moves',
  )
  await expect(page.locator('tbody tr')).toHaveCount(1)
  await page.getByRole('link', { name: 'Changes that have been reviewed', exact: true }).click()
  await expect(page.getByLabel('Name or prison number')).toHaveValue('A1234AA')
  await expect(page.getByLabel('Cell moves', { exact: true })).toBeChecked()
  await expect(page.locator('tbody')).toContainText('REVIEWER1')
  await page.getByRole('button', { name: 'Apply filters', exact: true }).click()
  await expect(page).toHaveURL(/reviewed=true/)
  await expect(page.locator('tbody tr')).toHaveCount(1)
  await page.getByRole('link', { name: 'Clear', exact: true }).click()
  await expect(page).toHaveURL(/reviewed=true/)
  await expect(page.getByLabel('Name or prison number')).toHaveValue('')
  await expect(page.getByLabel('Cell moves', { exact: true })).not.toBeChecked()
  await expect(page.getByText('No changes have been reviewed.', { exact: true })).toBeVisible()
})
