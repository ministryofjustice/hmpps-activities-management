import * as cheerio from 'cheerio'
import fs from 'fs'
import { compile, Template } from 'nunjucks'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'

const view = fs.readFileSync('server/views/pages/appointments/attendance-summary-stats/attendanceData.njk')

describe('Views - Appointment attendance data', () => {
  let compiledTemplate: Template

  const renderView = (overrides: Record<string, unknown> = {}) =>
    cheerio.load(
      compiledTemplate.render({
        date: '2025-07-09',
        now: new Date('2025-07-09T12:30:00Z'),
        title: 'All attended',
        subTitle: '1 attended',
        categories: [{ code: 'CHAP', description: 'Chaplaincy' }],
        appointmentName: 'CHAP',
        customAppointmentName: 'worship',
        attendanceState: 'ATTENDED',
        eventTier: '',
        organiserCode: '',
        searchTerm: 'A1234BC',
        showHostsFilter: false,
        isOlderThanSevenDays: false,
        appointments: [
          {
            firstName: 'Test',
            middleNames: '',
            lastName: 'Prisoner',
            prisonerNumber: 'A1234BC',
            cellLocation: '1-2-3',
            appointmentId: 11,
            appointmentHref: '/appointments/attendance/11/select-appointment',
            appointmentName: 'Monday Worship (Chaplaincy)',
            time: '10:30 to 11:00',
            date: '9 July 2025',
            timeDateSortingValue: new Date('2025-07-09T10:30:00Z'),
          },
        ],
        ...overrides,
      }),
    )

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), registerNunjucks())
  })

  it('renders headings, filters and attendee table data', () => {
    const $ = renderView()

    expect($('[data-qa="title"]').text().trim()).toEqual('All attended')
    expect($('[data-qa="subTitle"]').text().trim()).toEqual('1 attended')
    expect($('input[name="searchTerm"]').attr('value')).toEqual('A1234BC')
    expect($('select[name="appointmentName"] option:selected').attr('value')).toEqual('CHAP')
    expect($('input[name="customAppointmentName"]').attr('value')).toEqual('worship')
    expect(
      $('[data-qa="appointment-attendance-data"] th')
        .map((_, element) => $(element).text().trim())
        .get(),
    ).toEqual(['Attendee', 'Cell location', 'Appointment', 'Time and date'])
    expect($('[data-qa="appointment-attendance-data"]').text()).toContain('Prisoner, Test')
    expect($('[data-qa="appointment-attendance-data"]').text()).toContain('A1234BC')
    expect($('[data-qa="appointmentName-11"] a').attr('href')).toEqual('/appointments/attendance/11/select-appointment')
    expect($('[data-qa="refresh-button"]')).toHaveLength(1)
  })

  it('shows the host filter for Tier 2 results', () => {
    const $ = renderView({ showHostsFilter: true, eventTier: 'TIER_2', organiserCode: 'PRISON_STAFF' })

    expect($('input[name="organiserCode"]')).toHaveLength(4)
    expect($('input[name="organiserCode"]:checked').attr('value')).toEqual('PRISON_STAFF')
  })

  it('hides refresh for historical results', () => {
    const $ = renderView({
      title: 'All not recorded',
      subTitle: '1 not recorded',
      attendanceState: 'NOT_RECORDED',
      isOlderThanSevenDays: true,
    })

    expect($('[data-qa="title"]').text().trim()).toEqual('All not recorded')
    expect($('[data-qa="subTitle"]').text().trim()).toEqual('1 not recorded')
    expect($('[data-qa="refresh-button"]')).toHaveLength(0)
  })
})
