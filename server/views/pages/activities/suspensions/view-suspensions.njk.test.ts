import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'
import { PaidType } from '../../../../routes/activities/suspensions/handlers/viewSuspensions'

const view = fs.readFileSync('server/views/pages/activities/suspensions/view-suspensions.njk')

describe('Views - Suspensions - View suspensions', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
  })

  it('should show the suspension details for an allocation', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        groupedAllocations: [
          [
            {
              id: 1,
              activitySummary: 'Gym',
              plannedSuspension: {
                plannedStartDate: '2024-12-13',
                plannedEndDate: null,
                plannedBy: 'USER1',
                plannedAt: '2024-12-13T14:40:02.594376',
              },
              paidWhileSuspended: 'YES',
            },
          ],
        ],
        userMap: new Map([['USER1', { username: 'USER1', name: 'Joe Bloggs' }]]),
        caseNotesMap: new Map(),
        session: {
          req: {
            params: {
              prisonerNumber: 'A5015DY',
            },
          },
        },
      }),
    )

    const summary = $('[data-qa="suspension-summary"]')
    const keys = summary.find('.govuk-summary-list__key')
    const values = summary.find('.govuk-summary-list__value')

    expect(keys.eq(0).text().trim()).toBe('Activity')
    expect(values.eq(0).text()).toContain('Gym')

    expect(keys.eq(1).text().trim()).toBe('First day of suspension')
    expect(values.eq(1).text().trim()).toBe('Friday, 13 December 2024')

    expect(keys.eq(2).text().trim()).toBe('Last day of suspension')
    expect(values.eq(2).text().trim()).toBe('No end date')

    expect(keys.eq(3).text().trim()).toBe('Paid while suspended?')
    expect(values.eq(3).text().trim()).toBe('Yes')

    expect(keys.eq(4).text().trim()).toBe('Added by')
  })

  it.each([
    [PaidType.YES, { id: 1 }, 'Yes'],
    [PaidType.NO, { id: 1 }, 'No'],
    [PaidType.NO_UNPAID, null, 'No - activity is unpaid'],
  ])('renders the paid status %s correctly', (paidWhileSuspended, prisonPayBand, expected) => {
    const $ = cheerio.load(
      compiledTemplate.render({
        groupedAllocations: [
          [
            {
              id: 1,
              activitySummary: 'Activity 1',
              prisonPayBand,
              paidWhileSuspended,
              plannedSuspension: {
                plannedStartDate: '2026-08-20',
                plannedEndDate: null,
                plannedBy: 'USER1',
                plannedAt: '2026-08-20T12:00:00',
                dpsCaseNoteId: null,
              },
            },
          ],
        ],
        userMap: new Map([
          [
            'USER1',
            {
              username: 'USER1',
              name: 'Joe Bloggs',
            },
          ],
        ]),
        caseNotesMap: new Map(),
        session: {
          req: {
            params: {
              prisonerNumber: 'G0995GW',
            },
          },
        },
      }),
    )

    const paidRow = $('[data-qa="suspension-summary"] .govuk-summary-list__row').filter((_, element) =>
      $(element).find('.govuk-summary-list__key').text().includes('Paid while suspended?'),
    )

    expect(paidRow.find('.govuk-summary-list__value').text().trim()).toBe(expected)
  })
})
