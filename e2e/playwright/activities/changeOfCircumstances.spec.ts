import { expect, test } from '@playwright/test'

import stubs from '../../../integration_tests/mockApis/stubs'
import getEventsForReview from '../../../integration_tests/fixtures/activitiesOrchestratorApi/getEventsForReview.json'
import { resetStubs, stubEndpoint, stubFor } from '../../../integration_tests/mockApis/wiremock'
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
  await stubs.stubSignIn('Reviewer one')

  await stubFor({
    request: {
      method: 'GET',
      urlPath: '/event-review/prison/MDI',
      queryParameters: {
        date: { equalTo: '2023-05-16' },
        filterAcknowledged: { equalTo: 'false' },
        page: { equalTo: '0' },
        size: { equalTo: '25' },
      },
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      jsonBody: getEventsForReview,
    },
  })

  await stubEndpoint('POST', '/prisoner-search/prisoner-numbers', inmateDetails)
  await signIn(page)
})

test('a user can review changes in circumstances', async ({ page }) => {
  await page.goto('/activities/change-of-circumstances/view-changes?date=2023-05-16')

  await expect(
    page.getByRole('heading', {
      name: 'Changes to review',
      exact: true,
    }),
  ).toBeVisible()

  await expect(page.locator('.moj-pagination__results')).toHaveText(['4 total changes', '4 total changes'])

  const NonAssociationEvent = page.getByRole('row').filter({ hasText: 'Non-association' })

  await expect(NonAssociationEvent).toContainText('12:17')
  await expect(NonAssociationEvent).toContainText('Non-association')

  const terry = page.getByRole('row').filter({ hasText: 'Glasvern, Terry' })

  await expect(terry).toContainText('14:00')
  await expect(terry).toContainText('B-3-S-019')
  await expect(terry).toContainText('A-1-N-001')

  const john = page.getByRole('row').filter({ hasText: 'Armitage, John' })

  await expect(john).toContainText('15:20')
  await expect(john).toContainText('Unknown event')

  const alertEvent = page.getByRole('row').filter({ hasText: 'Alert added' })

  await expect(alertEvent).toContainText('16:30')
  await expect(alertEvent).toContainText('ACCT open')

  await expect(alertEvent.locator('.dps-alert-status--self-harm')).toBeVisible()
})

test('a user can switch to reviewed changes without selection controls', async ({ page }) => {
  await stubFor({
    request: {
      method: 'GET',
      urlPath: '/event-review/prison/MDI',
      queryParameters: {
        date: { equalTo: '2023-05-16' },
        filterAcknowledged: { equalTo: 'true' },
        page: { equalTo: '0' },
        size: { equalTo: '25' },
      },
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      jsonBody: {
        ...getEventsForReview,
        content: getEventsForReview.content.map(event => ({
          ...event,
          acknowledgedBy: 'USER1',
          acknowledgedTime: '2023-05-16T16:00:00',
        })),
      },
    },
  })

  await page.goto('/activities/change-of-circumstances/view-changes?date=2023-05-16')

  await page
    .getByRole('link', {
      name: 'Changes that have been reviewed',
      exact: true,
    })
    .click()

  await expect(page).toHaveURL(/reviewed=true/)

  await expect(
    page.getByRole('columnheader', {
      name: 'Reviewed by',
    }),
  ).toBeVisible()

  await expect(page.locator('tbody')).toContainText('Reviewer one')

  await expect(page.locator('tbody input[type="checkbox"]')).toHaveCount(0)

  await page
    .getByRole('link', {
      name: 'Changes to review',
      exact: true,
    })
    .click()

  await expect(page.locator('tbody input[type="checkbox"]')).toHaveCount(4)
})

test('Continue from date selection opens the selected date and sortable changes table', async ({ page }) => {
  await page.goto('/activities/change-of-circumstances/select-period')

  await page.getByRole('radio', { name: 'A different date' }).check()
  await page.locator('#date').fill('16/05/2023')

  await page.getByRole('button', { name: 'Continue', exact: true }).click()

  await expect(
    page.getByRole('heading', {
      name: 'Changes to review',
      exact: true,
    }),
  ).toBeVisible()

  await expect(
    page.getByText('Tuesday, 16 May 2023', {
      exact: true,
    }),
  ).toBeVisible()

  const rows = page.locator('tbody tr')

  // Initial sort: Time ascending
  await expect(rows.nth(0)).toContainText('12:17')
  await expect(rows.nth(1)).toContainText('14:00')
  await expect(rows.nth(2)).toContainText('15:20')
  await expect(rows.nth(3)).toContainText('16:30')

  const timeHeader = page.getByRole('columnheader', { name: 'Time' })

  await expect(timeHeader).toHaveAttribute('aria-sort', 'ascending')

  await timeHeader.getByRole('button').click()

  await expect(timeHeader).toHaveAttribute('aria-sort', 'descending')

  // Time descending
  await expect(rows.nth(0)).toContainText('16:30')
  await expect(rows.nth(1)).toContainText('15:20')
  await expect(rows.nth(2)).toContainText('14:00')
  await expect(rows.nth(3)).toContainText('12:17')

  await page.getByRole('columnheader', { name: 'Change', exact: true }).getByRole('button').click()

  // Change ascending
  await expect(rows.nth(0)).toContainText('Alert added')
  await expect(rows.nth(1)).toContainText('Cell move')
  await expect(rows.nth(2)).toContainText('Non-association')
  await expect(rows.nth(3)).toContainText('Unknown event')

  await page.getByRole('columnheader', { name: 'Prisoner', exact: true }).getByRole('button').click()

  // Prisoner ascending (Armitage, Glasvern, Johnson, Johnson)
  await expect(rows.nth(0)).toContainText('Armitage, John')
  await expect(rows.nth(1)).toContainText('Glasvern, Terry')

  await expect(rows.nth(2)).toContainText('Johnson, Joe')
  await expect(rows.nth(3)).toContainText('Johnson, Joe')

  await expect(page.getByRole('columnheader', { name: 'Details' }).getByRole('button')).toHaveCount(0)

  await expect(page.getByRole('columnheader', { name: 'Allocations' }).getByRole('button')).toHaveCount(0)
})

test('filters persist across tabs, and Apply and Clear retain the reviewed tab', async ({ page }) => {
  // Filtered outstanding changes
  await stubFor({
    request: {
      method: 'GET',
      urlPath: '/event-review/prison/MDI',
      queryParameters: {
        date: { equalTo: '2023-05-16' },
        prisonerNumbers: { equalTo: 'A1234AA' },
        filterAcknowledged: { equalTo: 'false' },
      },
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      jsonBody: {
        content: [
          {
            ...getEventsForReview.content[1],
            prisonerNumber: 'A1234AA',
            acknowledgedBy: null,
          },
        ],
        totalElements: 1,
        totalPages: 1,
        pageNumber: 0,
      },
    },
  })

  // Filtered reviewed changes
  await stubFor({
    request: {
      method: 'GET',
      urlPath: '/event-review/prison/MDI',
      queryParameters: {
        date: { equalTo: '2023-05-16' },
        prisonerNumbers: { equalTo: 'A1234AA' },
        filterAcknowledged: { equalTo: 'true' },
      },
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      jsonBody: {
        content: [
          {
            ...getEventsForReview.content[1],
            prisonerNumber: 'A1234AA',
            acknowledgedBy: 'USER1',
          },
        ],
        totalElements: 1,
        totalPages: 1,
        pageNumber: 0,
      },
    },
  })

  // Reviewed tab after Clear
  await stubFor({
    priority: 10,
    request: {
      method: 'GET',
      urlPath: '/event-review/prison/MDI',
      queryParameters: {
        date: { equalTo: '2023-05-16' },
        filterAcknowledged: { equalTo: 'true' },
        page: { equalTo: '0' },
        size: { equalTo: '25' },
      },
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      jsonBody: {
        content: [],
        totalElements: 0,
        totalPages: 0,
        pageNumber: 0,
      },
    },
  })

  await page.goto(
    '/activities/change-of-circumstances/view-changes?date=2023-05-16&searchTerm=A1234AA&changeTypes=cell-moves',
  )

  await expect(page.locator('tbody tr')).toHaveCount(1)

  await page
    .getByRole('link', {
      name: 'Changes that have been reviewed',
      exact: true,
    })
    .click()

  await expect(page.getByLabel('Name or prison number')).toHaveValue('A1234AA')
  await expect(page.getByLabel('Cell moves', { exact: true })).toBeChecked()
  await expect(page.locator('tbody')).toContainText('Reviewer one')

  await page.getByRole('button', { name: 'Apply filters', exact: true }).click()

  await expect(page).toHaveURL(/reviewed=true/)
  await expect(page.locator('tbody tr')).toHaveCount(1)

  await page.getByRole('link', { name: 'Clear', exact: true }).click()

  await expect(page).toHaveURL(/reviewed=true/)
  await expect(page.getByLabel('Name or prison number')).toHaveValue('')
  await expect(page.getByLabel('Cell moves', { exact: true })).not.toBeChecked()

  await expect(page.getByText('No changes have been reviewed.', { exact: true })).toBeVisible()
})
