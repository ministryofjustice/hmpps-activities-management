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
      updatedBy: 'Joe Bloggs',
      latestUpdatedDateTime: '2024-05-09T10:30:00',
      removedFromScheduleHistory: [
        {
          weekNumber: 1,
          timeSlots: ['AM', 'PM'],
          dayOfWeek: 'MONDAY',
          revisionType: 'ADDED',
          revision: 1,
          updatedBy: 'Joe Bloggs',
          updatedDateTime: '2024-05-09T10:30:00',
        },
      ],
      addedToScheduleHistory: [
        {
          weekNumber: 2,
          timeSlots: ['AM', 'PM', 'ED'],
          dayOfWeek: 'WEDNESDAY',
          revisionType: 'ADDED',
          revision: 2,
          updatedBy: 'Joe Bloggs',
          updatedDateTime: '2024-05-09T10:30:00',
        },
      ],
      showWeekNumber: true,
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

  it('should display last schedule history details with multiple timeslot formatting', () => {
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('.govuk-summary-list > .govuk-summary-list__row > .govuk-summary-list__key').text().trim()).toContain(
      'Schedule last changed',
    )

    expect($('.govuk-summary-list > .govuk-summary-list__row > .govuk-summary-list__value').text().trim()).toContain(
      'on 2 April 2025 at 14:40',
    )

    expect($('.govuk-summary-list > .govuk-summary-list__row > .govuk-summary-list__value').text().trim()).toContain(
      'Removed from:',
    )

    expect($('.govuk-summary-list > .govuk-summary-list__row > .govuk-summary-list__value').text().trim()).toContain(
      'Added to:',
    )

    expect($('.govuk-summary-list > .govuk-summary-list__row > .govuk-summary-list__value').text()).toContain(
      'AM and PM',
    )

    expect($('.govuk-summary-list > .govuk-summary-list__row > .govuk-summary-list__value').text()).toContain(
      'AM, PM and ED',
    )
  })

  it('should hide the latest schedule history section when there is no schedule history', () => {
    viewContext.removedFromScheduleHistory = []
    viewContext.addedToScheduleHistory = []

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('.govuk-summary-list').text()).not.toContain('Schedule last changed')

    expect($('.govuk-summary-list').text()).not.toContain('Removed from:')

    expect($('.govuk-summary-list').text()).not.toContain('Added to:')
  })
})
