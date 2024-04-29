import * as cheerio from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import fs from 'fs'
import { addDays, format, subDays } from 'date-fns'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'
import { AppointmentJourney, AppointmentType } from '../../../../routes/appointments/create-and-edit/appointmentJourney'
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
  }

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = nunjucks.compile(view.toString(), njkEnv)
    viewContext = {
      appointment: {} as AppointmentDetails,
      session: {
        appointmentJourney: {} as AppointmentJourney,
      },
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
      `You have successfully scheduled an appointment for 1 person on ${format(tomorrow, 'EEEE, d MMMM yyyy')}.`,
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
      `You have successfully created an appointment for 1 person on ${format(fiveDaysAgo, 'EEEE, d MMMM yyyy')}.`,
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
        `You have successfully scheduled an appointment for 1 person starting on ${format(
          tomorrow,
          'EEEE, d MMMM yyyy',
        )}. It will repeat ${expectedText} for 6 appointments`,
      )
    },
  )

  describe('Group Appointment', () => {
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
  })
})
