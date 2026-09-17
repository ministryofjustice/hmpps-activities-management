import * as cheerio from 'cheerio'
import fs from 'fs'
import { compile, Template } from 'nunjucks'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'

const view = fs.readFileSync('server/views/pages/appointments/attendance-summary-stats/dashboard.njk')

describe('Views - Appointment attendance summary dashboard', () => {
  let compiledTemplate: Template

  const renderView = (isOlderThanSevenDays: boolean) =>
    cheerio.load(
      compiledTemplate.render({
        date: '2025-07-09',
        now: new Date('2025-07-09T12:30:00Z'),
        categories: [{ code: 'CHAP', description: 'Chaplaincy' }],
        appointmentName: 'CHAP',
        customAppointmentName: 'worship',
        summariesNotCancelled: [{ id: 1 }],
        attendanceSummary: {
          attendeeCount: 10,
          attended: 4,
          attendedPercentage: 40,
          notAttended: 2,
          notAttendedPercentage: 20,
          notRecorded: 4,
          notRecordedPercentage: 40,
          tier1Count: 1,
          tier2Count: 2,
          foundationCount: 1,
        },
        cancelledCount: 3,
        isOlderThanSevenDays,
      }),
    )

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), registerNunjucks())
  })

  it('renders current attendance totals, links and the refresh action', () => {
    const $ = renderView(false)

    expect($('[data-qa="appointmentsNotCancelledTotal"]').text().replace(/\s+/g, ' ').trim()).toContain(
      '10 attendees for 1 appointment',
    )
    expect($('[data-qa="attended"]').text()).toContain('4')
    expect($('[data-qa="notAttended"]').text()).toContain('2')
    expect($('[data-qa="notRecorded"]').text()).toContain('Not recorded yet')
    expect($('[data-qa="notRecorded-link"]').attr('href')).toContain('attendanceState=NOT_RECORDED')
    expect($('[data-qa="notRecorded-link"]').attr('href')).toContain('appointmentName=CHAP')
    expect($('[data-qa="notRecorded-link"]').attr('href')).toContain('customAppointmentName=worship')
    expect($('[data-qa="refresh-button"]')).toHaveLength(1)
  })

  it('uses historical not-recorded wording and hides refresh', () => {
    const $ = renderView(true)

    expect($('[data-qa="notRecorded"]').text()).toContain('Not recorded')
    expect($('[data-qa="notRecorded"]').text()).not.toContain('Not recorded yet')
    expect($('[data-qa="notRecorded-link"]').text()).toContain('All not recorded')
    expect($('[data-qa="notRecorded-link"]').text()).not.toContain('All not recorded yet')
    expect($('[data-qa="refresh-button"]')).toHaveLength(0)
  })
})
