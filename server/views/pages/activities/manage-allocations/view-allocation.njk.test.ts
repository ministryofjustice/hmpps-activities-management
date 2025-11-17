import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'
import { UserDetails } from '../../../../@types/manageUsersApiImport/types'

const view = fs.readFileSync('server/views/pages/activities/manage-allocations/view-allocation.njk')

describe('Views - Change allocation details', () => {
  let compiledTemplate: Template
  let viewContext: Record<string, unknown>

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
    viewContext = {
      allocation: {
        id: 1234,
        prisonerNumber: 'A4243EA',
        activitySummary: 'A Wing Cleaner',
        status: 'ACTIVE',
        startDate: '2025-04-07',
        endDate: '2025-04-29',
        activityId: 79,
        allocatedTime: '2025-04-02T14:40:02',
        allocatedBy: 'SCH_ACTIVITY_1',
        plannedSuspension: {
          plannedAt: '2025-04-11T10:30:02',
          plannedStartDate: '2025-04-15',
          plannedEndDate: '2025-04-30',
          plannedBy: 'SCH_ACTIVITY',
        },
      },
      prisonerName: 'Billy Fdas',
      userMap: new Map([['joebloggs', { name: 'Joe Bloggs' }]]) as unknown as Map<string, UserDetails>,
    }
  })

  it('view suspension details', () => {
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('.govuk-caption-xl').text().trim()).toEqual('A Wing Cleaner')
    expect($('h1').text().trim()).toEqual('Change allocation details for Billy Fdas (A4243EA)')
    expect($('h2').text().trim()).toContain('Suspension added on Friday, 11 April 2025')

    expect($('.govuk-summary-list > .govuk-summary-list__row > .govuk-summary-list__key').text().trim()).toContain(
      'First day of suspension',
    )
    expect($('.govuk-summary-list > .govuk-summary-list__row > .govuk-summary-list__value').text().trim()).toContain(
      'Tuesday, 15 April 2025',
    )
    expect($('.govuk-summary-list > .govuk-summary-list__row > .govuk-summary-list__key').text().trim()).toContain(
      'Last day of suspension',
    )
    expect($('.govuk-summary-list > .govuk-summary-list__row > .govuk-summary-list__value').text().trim()).toContain(
      'Wednesday, 30 April 2025',
    )
  })
})
