import * as cheerio from 'cheerio'
import fs from 'fs'
import { compile, Template } from 'nunjucks'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'

const view = fs.readFileSync('server/views/pages/appointments/attendance/summaries.njk')

const summary = {
  id: 1,
  appointmentName: 'Gym',
  startTime: '11:00',
  endTime: '13:30',
  internalLocation: {
    description: 'Gym',
  },
  attendees: [],
  attendedCount: 1,
  nonAttendedCount: 0,
  notRecordedCount: 2,
}

const attendanceSummary = {
  attendeeCount: 3,
  attended: 1,
  notAttended: 0,
  notRecorded: 2,
  attendedPercentage: 33,
  notAttendedPercentage: 0,
  notRecordedPercentage: 67,
}

describe('Views - Appointments - Attendance - Summaries', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  const viewContext = () => ({
    date: new Date('2026-08-12T00:00:00Z'),
    summaries: [summary],
    attendanceSummary,
    prisonersDetails: {},
    locations: [],
    filterItems: {
      locationType: 'ALL',
      locationId: null,
    },
    session: {
      req: {
        query: {},
      },
    },
    user: {
      activeCaseLoadId: 'MDI',
      externalActivitiesRolledOut: false,
    },
    isOlderThanSevenDays: false,
    isFutureDate: false,
  })

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
  })

  it('should display view-only content when the appointment date is more than 7 days old', () => {
    const context = viewContext()
    context.date = new Date('2026-08-04T00:00:00Z')
    context.isOlderThanSevenDays = true

    const $ = cheerio.load(compiledTemplate.render(context))

    expect($('h1').text().trim()).toBe('Find an appointment to view attendance')
    expect($('[data-qa=summary-not-recorded]').text()).toContain('Not recorded:')
    expect($('[data-qa=summary-not-recorded]').text()).not.toContain('Not recorded yet:')
    expect($('thead').text()).toContain('Not recorded')
    expect($('thead').text()).not.toContain('Not recorded yet')
    expect($('button:contains("View attendance")')).toHaveLength(1)
    expect($('button:contains("Record or edit attendance")')).toHaveLength(0)
  })

  it('should display future appointment content when attendance cannot yet be recorded', () => {
    const context = viewContext()
    context.date = new Date('2026-08-13T00:00:00Z')
    context.isFutureDate = true

    const $ = cheerio.load(compiledTemplate.render(context))

    expect($('h1').text().trim()).toBe('Find an appointment to view attendees')
    expect($('[data-qa=attendance-hint]').text().trim()).toBe(
      'You cannot record attendance until Thursday, 13 August 2026',
    )
    expect($('[data-qa=date-caption]').text().trim()).toBe('Thursday, 13 August 2026')
    expect($('button:contains("View attendees")')).toHaveLength(1)
    expect($('button:contains("Record or edit attendance")')).toHaveLength(0)
  })
})
