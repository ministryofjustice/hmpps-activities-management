import * as cheerio from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import fs from 'fs'
import { addDays, format, subDays } from 'date-fns'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'
import { AppointmentJourney, AppointmentType } from '../../../../routes/appointments/create-and-edit/appointmentJourney'
import { AppointmentSetJourney } from '../../../../routes/appointments/create-and-edit/appointmentSetJourney'
import { AppointmentFrequency } from '../../../../@types/appointments'
import { AppointmentDetails } from '../../../../@types/activitiesAPI/types'
import { formatDate } from '../../../../utils/utils'
import { YesNo } from '../../../../@types/activities'

const view = fs.readFileSync('server/views/pages/appointments/create-and-edit/confirmation.njk')

describe('Views - Create Appointment - Confirmation', () => {
  let compiledTemplate: Template
  const tomorrow = addDays(new Date(), 1)
  let viewContext = {
    appointment: {} as AppointmentDetails,
    session: {
      appointmentJourney: {} as AppointmentJourney,
    },
    appointmentSet: null as AppointmentSetJourney,
  }

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = nunjucks.compile(view.toString(), njkEnv)
    viewContext = {
      appointment: {} as AppointmentDetails,
      session: {
        appointmentJourney: {} as AppointmentJourney,
      },
      appointmentSet: null as AppointmentSetJourney,
    }
  })

  it('should not display repeat frequency or number of appointments when no schedule is defined', () => {
    viewContext.appointment = {
      appointmentSeries: { schedule: null },
      appointmentType: AppointmentType.GROUP,
      startDate: formatDate(tomorrow, 'yyyy-MM-dd'),
      attendees: [
        {
          prisoner: {
            firstName: 'TEST',
            lastName: 'PRISONER',
          },
        },
      ],
    } as AppointmentDetails

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=message]').text().trim().replace(/\s+/g, ' ')).toEqual(
      `You have successfully scheduled an appointment for Test Prisoner on ${format(tomorrow, 'EEEE, d MMMM yyyy')}.`,
    )
  })

  it('should display create message when the appointment is retrospective', () => {
    const fiveDaysAgo = subDays(new Date(), 5)
    viewContext.appointment = {
      appointmentSeries: { schedule: null },
      appointmentType: AppointmentType.GROUP,
      startDate: formatDate(fiveDaysAgo, 'yyyy-MM-dd'),
      attendees: [
        {
          prisoner: {
            firstName: 'TEST',
            lastName: 'PRISONER',
          },
        },
      ],
    } as AppointmentDetails

    viewContext.session.appointmentJourney.retrospective = YesNo.YES

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=message]').text().trim().replace(/\s+/g, ' ')).toEqual(
      `You have successfully created an appointment for Test Prisoner on ${format(fiveDaysAgo, 'EEEE, d MMMM yyyy')}.`,
    )
  })

  it('should display create message for single person in the appointment set', () => {
    viewContext.appointmentSet = {
      startDate: '2025-04-22',
      appointments: [
        {
          startTime: { hour: 9, minute: 0 },
          endTime: { hour: 9, minute: 15 },
          prisoner: {
            number: 'A1234BC',
            name: 'TEST01 PRISONER01',
            firstName: 'TEST01',
            lastName: 'PRISONER01',
            cellLocation: '1-1-1',
            status: 'ACTIVE IN',
            prisonCode: 'MDI',
          },
        },
      ],
    } as AppointmentSetJourney

    viewContext.session.appointmentJourney.retrospective = YesNo.YES
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=message]').text().trim().replace(/\s+/g, ' ')).toEqual(
      `You have successfully created an appointment for Test01 Prisoner01 on ${format('2025-04-22', 'EEEE, d MMMM yyyy')}.`,
    )
  })

  it('should display scheduled message for single person in the appointment set', () => {
    viewContext.appointmentSet = {
      startDate: '2025-04-22',
      appointments: [
        {
          startTime: { hour: 9, minute: 0 },
          endTime: { hour: 9, minute: 15 },
          prisoner: {
            number: 'A1234BC',
            name: 'TEST01 PRISONER01',
            firstName: 'TEST01',
            lastName: 'PRISONER01',
            cellLocation: '1-1-1',
            status: 'ACTIVE IN',
            prisonCode: 'MDI',
          },
        },
      ],
    } as AppointmentSetJourney

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=message]').text().trim().replace(/\s+/g, ' ')).toEqual(
      `You have successfully scheduled an appointment for Test01 Prisoner01 on ${format('2025-04-22', 'EEEE, d MMMM yyyy')}.`,
    )
  })

  it.each([
    { frequency: AppointmentFrequency.WEEKDAY, expectedText: 'every weekday (Monday to Friday)' },
    { frequency: AppointmentFrequency.DAILY, expectedText: 'daily (includes weekends)' },
    { frequency: AppointmentFrequency.WEEKLY, expectedText: 'weekly' },
    { frequency: AppointmentFrequency.FORTNIGHTLY, expectedText: 'fortnightly' },
    { frequency: AppointmentFrequency.MONTHLY, expectedText: 'monthly' },
  ])(
    'frequency $frequency should be displayed as $expectedText with number of appointments when repeat = YES',
    ({ frequency, expectedText }) => {
      viewContext.appointment = {
        appointmentSeries: { schedule: { frequency, numberOfAppointments: 6 } },
        appointmentType: AppointmentType.GROUP,
        startDate: formatDate(tomorrow, 'yyyy-MM-dd'),
        attendees: [
          {
            prisoner: {
              firstName: 'TEST',
              lastName: 'PRISONER',
            },
          },
        ],
      } as AppointmentDetails

      const $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('[data-qa=message]').text().trim().replace(/\s+/g, ' ')).toEqual(
        `You have successfully scheduled an appointment for Test Prisoner starting on ${format(
          tomorrow,
          'EEEE, d MMMM yyyy',
        )}. It will repeat ${expectedText} for 6 appointments.`,
      )
    },
  )

  describe('Group Appointment', () => {
    it('should display number of prisoners scheduled to appointment', () => {
      viewContext.appointment = {
        appointmentSeries: { schedule: null },
        appointmentType: AppointmentType.GROUP,
        startDate: formatDate(tomorrow, 'yyyy-MM-dd'),
        attendees: [
          {
            prisoner: {
              firstName: 'TEST',
              lastName: 'PRISONER',
            },
          },
          {
            prisoner: {
              firstName: 'SECOND',
              lastName: 'PRISONER',
            },
          },
          {
            prisoner: {
              firstName: 'THIRD',
              lastName: 'PRISONER',
            },
          },
        ],
      } as AppointmentDetails

      const $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('[data-qa=message]').text().trim().replace(/\s+/g, ' ')).toEqual(
        `You have successfully scheduled an appointment for 3 people on ${format(tomorrow, 'EEEE, d MMMM yyyy')}.`,
      )
    })

    it('should display number of prisoners added to appointment', () => {
      viewContext.appointment = {
        appointmentSeries: { schedule: null },
        appointmentType: AppointmentType.GROUP,
        startDate: formatDate(tomorrow, 'yyyy-MM-dd'),
        attendees: [
          {
            prisoner: {
              firstName: 'TEST',
              lastName: 'PRISONER',
            },
          },
          {
            prisoner: {
              firstName: 'SECOND',
              lastName: 'PRISONER',
            },
          },
        ],
      } as AppointmentDetails

      viewContext.session.appointmentJourney.retrospective = YesNo.YES
      const $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('[data-qa=message]').text().trim().replace(/\s+/g, ' ')).toEqual(
        `You have successfully created an appointment for 2 people on ${format(tomorrow, 'EEEE, d MMMM yyyy')}.`,
      )
    })

    it('should display number of prisoners added to appointment from appointment set', () => {
      viewContext.appointmentSet = {
        startDate: '2025-04-22',
        appointments: [
          {
            startTime: { hour: 9, minute: 0 },
            endTime: { hour: 9, minute: 15 },
            prisoner: {
              number: 'A1234BC',
              name: 'TEST01 PRISONER01',
              firstName: 'TEST01',
              lastName: 'PRISONER01',
              cellLocation: '1-1-1',
              status: 'ACTIVE IN',
              prisonCode: 'MDI',
            },
          },
          {
            startTime: { hour: 9, minute: 15 },
            endTime: { hour: 9, minute: 30 },
            prisoner: {
              number: 'B2345CD',
              name: 'TEST02 PRISONER02',
              firstName: 'TEST02',
              lastName: 'PRISONER02',
              cellLocation: '1-1-2',
              status: 'ACTIVE IN',
              prisonCode: 'MDI',
            },
          },
        ],
      } as AppointmentSetJourney

      viewContext.session.appointmentJourney.retrospective = YesNo.YES
      const $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('[data-qa=message]').text().trim().replace(/\s+/g, ' ')).toEqual(
        `You have successfully created appointments for 2 people starting on ${format('2025-04-22', 'EEEE, d MMMM yyyy')}.`,
      )
    })

    it('should display number of prisoners scheduled to appointment from appointment set', () => {
      viewContext.appointmentSet = {
        startDate: '2025-04-22',
        appointments: [
          {
            startTime: { hour: 9, minute: 0 },
            endTime: { hour: 9, minute: 15 },
            prisoner: {
              number: 'A1234BC',
              name: 'TEST01 PRISONER01',
              firstName: 'TEST01',
              lastName: 'PRISONER01',
              cellLocation: '1-1-1',
              status: 'ACTIVE IN',
              prisonCode: 'MDI',
            },
          },
          {
            startTime: { hour: 9, minute: 15 },
            endTime: { hour: 9, minute: 30 },
            prisoner: {
              number: 'B2345CD',
              name: 'TEST02 PRISONER02',
              firstName: 'TEST02',
              lastName: 'PRISONER02',
              cellLocation: '1-1-2',
              status: 'ACTIVE IN',
              prisonCode: 'MDI',
            },
          },
        ],
      } as AppointmentSetJourney

      const $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('[data-qa=message]').text().trim().replace(/\s+/g, ' ')).toEqual(
        `You have successfully scheduled appointments for 2 people starting on ${format('2025-04-22', 'EEEE, d MMMM yyyy')}.`,
      )
    })
  })
})
