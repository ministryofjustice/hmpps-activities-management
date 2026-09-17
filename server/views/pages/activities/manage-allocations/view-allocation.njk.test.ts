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
      latestScheduleChanges: {
        week1: {
          type: 'ACTIVITY',
          weekNumber: 1,
          changedAt: '2026-09-16T10:30:00',
          changedBy: 'joebloggs',
          added: [],
          removed: [
            {
              weekNumber: 1,
              dayOfWeek: 'TUESDAY',
              timeSlots: ['AM', 'PM'],
            },
          ],
        },
        week2: {
          type: 'PRISONER',
          weekNumber: 2,
          changedAt: '2026-09-15T10:30:00',
          changedBy: 'joebloggs',
          added: [
            {
              weekNumber: 2,
              dayOfWeek: 'WEDNESDAY',
              timeSlots: ['AM', 'PM', 'ED'],
            },
          ],
          removed: [],
        },
      },
      twoWeekSchedule: true,
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

  it('should display latest 1 week schedule history details with multiple timeslot formatting', () => {
    viewContext.twoWeekSchedule = false
    viewContext.latestScheduleChanges = {
      week1: {
        type: 'PRISONER',
        weekNumber: 1,
        changedAt: '2026-09-01T10:30:00',
        changedBy: 'joebloggs',
        added: [
          {
            weekNumber: 1,
            dayOfWeek: 'WEDNESDAY',
            timeSlots: ['AM', 'PM', 'ED'],
          },
        ],
        removed: [],
      },
      week2: null,
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('.govuk-summary-list > .govuk-summary-list__row > .govuk-summary-list__key').text().trim()).toContain(
      'Week 1 schedule last changed',
    )

    expect(
      $('.govuk-summary-list > .govuk-summary-list__row > .govuk-summary-list__value').text().trim(),
    ).not.toContain('No changes made')

    expect($('.govuk-summary-list > .govuk-summary-list__row > .govuk-summary-list__value').text().trim()).toContain(
      '1 September 2026 at 10:30',
    )

    expect($('.govuk-summary-list > .govuk-summary-list__row > .govuk-summary-list__value').text().trim()).toContain(
      'Added:',
    )

    expect(
      $('.govuk-summary-list > .govuk-summary-list__row > .govuk-summary-list__value').text().trim(),
    ).not.toContain('Removed:')

    expect($('.govuk-summary-list > .govuk-summary-list__row > .govuk-summary-list__value').text()).toContain(
      'AM, PM and ED',
    )
  })

  it('should display latest 2 week schedule history details with multiple timeslot formatting', () => {
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('.govuk-summary-list > .govuk-summary-list__row > .govuk-summary-list__value').text().trim()).toContain(
      'Activity schedule changed',
    )

    expect($('.govuk-summary-list > .govuk-summary-list__row > .govuk-summary-list__value').text().trim()).toContain(
      '16 September 2026 at 10:30',
    )

    expect($('.govuk-summary-list > .govuk-summary-list__row > .govuk-summary-list__value').text().trim()).toContain(
      '15 September 2026 at 10:30',
    )

    expect($('.govuk-summary-list > .govuk-summary-list__row > .govuk-summary-list__value').text().trim()).toContain(
      'Removed:',
    )

    expect($('.govuk-summary-list > .govuk-summary-list__row > .govuk-summary-list__value').text().trim()).toContain(
      'Added:',
    )

    expect($('.govuk-summary-list > .govuk-summary-list__row > .govuk-summary-list__value').text()).toContain(
      'AM and PM',
    )

    expect($('.govuk-summary-list > .govuk-summary-list__row > .govuk-summary-list__value').text()).toContain(
      'AM, PM and ED',
    )
  })

  it('should display "No changes made" when there is no schedule change history', () => {
    viewContext.latestScheduleChanges = []

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('.govuk-summary-list').text()).toContain('No changes made')

    expect($('.govuk-summary-list').text()).not.toContain('Removed from:')

    expect($('.govuk-summary-list').text()).not.toContain('Added to:')
  })
})
