import * as cheerio from 'cheerio'
import fs from 'fs'
import { compile, Template } from 'nunjucks'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'

const view = fs.readFileSync('server/views/pages/appointments/attendance/attendees.njk')

const gym = {
  id: 1,
  appointmentName: 'Gym',
  startDate: '2026-08-12',
  startTime: '02:20',
  endTime: '06:30',
  internalLocation: {
    description: 'Gym',
  },
}

const chaplaincy = {
  id: 2,
  appointmentName: 'Chaplaincy',
  startDate: '2026-08-12',
  startTime: '15:00',
  endTime: '16:00',
  internalLocation: {
    description: 'Chapel',
  },
}

const prisoner = {
  prisonerNumber: 'A1234BC',
  firstName: 'TEST',
  lastName: 'PRISONER',
  prisonCode: 'MDI',
  cellLocation: 'A-1-1',
}

const attendanceSummary = {
  attendeeCount: 2,
  attended: 1,
  notAttended: 0,
  notRecorded: 1,
  attendedPercentage: 50,
  notAttendedPercentage: 0,
  notRecordedPercentage: 50,
}

const attendee = (appointment: typeof gym, attended: boolean | null, prisonerNumber = prisoner.prisonerNumber) => ({
  appointment,
  attended,
  otherEvents: [],
  prisoner: {
    ...prisoner,
    prisonerNumber,
  },
})

describe('Views - Appointments - Attendance - Attendees', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  const viewContext = () => ({
    appointments: [gym],
    attendeeRows: [attendee(gym, null)],
    attendanceSummary: {
      ...attendanceSummary,
      attendeeCount: 1,
      attended: 0,
      notRecorded: 1,
      attendedPercentage: 0,
      notRecordedPercentage: 100,
    },
    recordAppointmentAttendanceJourney: {
      date: '2026-08-12',
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

  it('should display appointment details when recording attendance for a single appointment', () => {
    const context = viewContext()
    context.attendanceSummary = {
      ...attendanceSummary,
      attendeeCount: 3,
      attended: 1,
      notRecorded: 2,
      attendedPercentage: 33,
      notRecordedPercentage: 67,
    }

    const $ = cheerio.load(compiledTemplate.render(context))

    expect($('h1').text().trim()).toBe('Gym')
    expect($('[data-qa=time-range-caption]').text().trim()).toBe('02:20 to 06:30')
    expect($('[data-qa=date-caption]').text().trim()).toBe('Wednesday, 12 August 2026')
    expect($('[data-qa=location]').text().trim()).toBe('Gym')
    expect($('[data-qa=summary-attended]').text()).toContain('1 (33%)')
    expect($('[data-qa=summary-not-recorded]').text()).toContain('2 (67%)')
  })

  it('should display view-only attendance when the appointment is more than 7 days old', () => {
    const context = viewContext()
    context.appointments = [gym, chaplaincy]
    context.attendeeRows = [attendee(gym, true), attendee(chaplaincy, null, 'B2345CD')]
    context.attendanceSummary = attendanceSummary
    context.isOlderThanSevenDays = true

    const $ = cheerio.load(compiledTemplate.render(context))

    expect($('h1').text().trim()).toBe('View attendance at 2 appointments')
    expect($('[data-qa=summary-not-recorded]').text()).toContain('Not recorded:')
    expect($('[data-qa=summary-not-recorded]').text()).not.toContain('Not recorded yet:')
    expect($('input[type=checkbox]')).toHaveLength(0)
    expect($('button:contains("Mark as attended")')).toHaveLength(0)
    expect($('button:contains("Mark as not attended")')).toHaveLength(0)
    expect($('.sticky-select').text()).toContain('Not recorded')
    expect($('.sticky-select').text()).not.toContain('Not recorded yet')
    expect($('[data-qa=view-or-edit-1-A1234BC]').text()).toContain('View')
    expect($('[data-qa=view-or-edit-1-A1234BC]').text()).not.toContain('View or edit')
  })

  it('should prevent selecting attendees for a future appointment', () => {
    const context = viewContext()
    context.appointments = [
      {
        ...gym,
        startDate: '2026-08-13',
      },
    ]
    context.attendeeRows = [
      attendee(
        {
          ...gym,
          startDate: '2026-08-13',
        },
        null,
      ),
    ]
    context.recordAppointmentAttendanceJourney.date = '2026-08-13'
    context.isFutureDate = true

    const $ = cheerio.load(compiledTemplate.render(context))

    expect($('[data-qa=attendance-hint]').text().trim()).toBe(
      'You cannot record attendance until Thursday, 13 August 2026',
    )
    expect($('input[type=checkbox]')).toHaveLength(0)
    expect($('.sticky-select').text()).toContain('Not recorded yet')
  })

  it('should display an empty state when no attendees match the search', () => {
    const context = viewContext()
    context.attendeeRows = []
    context.attendanceSummary = {
      ...attendanceSummary,
      attendeeCount: 0,
      attended: 0,
      notRecorded: 0,
      attendedPercentage: 0,
      notRecordedPercentage: 0,
    }

    const $ = cheerio.load(compiledTemplate.render(context))

    expect($('.sticky-select').text()).toContain('No attendees to display')
  })
})
