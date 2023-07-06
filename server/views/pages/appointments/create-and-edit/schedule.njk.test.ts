import * as cheerio from 'cheerio'
import { CheerioAPI } from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import fs from 'fs'
import { addDays } from 'date-fns'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'
import { AppointmentJourney, AppointmentType } from '../../../../routes/appointments/create-and-edit/appointmentJourney'
import { BulkAppointmentJourney } from '../../../../routes/appointments/create-and-edit/bulkAppointmentJourney'
import { EventSource, EventType } from '../../../../@types/activities'
import { formatDate } from '../../../../utils/utils'

let $: CheerioAPI
const view = fs.readFileSync('server/views/pages/appointments/create-and-edit/schedule.njk')

const tomorrow = addDays(new Date(), 1)

const getAppointmentDetailsValueElement = (heading: string) =>
  $(`[data-qa=appointment-details] > .govuk-summary-list__row > .govuk-summary-list__key`)
    .filter((index, element) => $(element).text().trim() === heading)
    .parent()
    .find('.govuk-summary-list__value')

const getScheduledEventsForPrisoner = (prisoner: { number: string; name: string; cellLocation: string }) => [
  {
    prisonerNumber: prisoner.number,
    eventType: EventType.ACTIVITY,
    eventSource: EventSource.SCHEDULING_AND_ALLOCATION,
    summary: `Activity for ${prisoner.number}`,
    internalLocationDescription: 'Activity location',
  },
  {
    prisonerNumber: prisoner.number,
    eventType: EventType.APPOINTMENT,
    eventSource: EventSource.SCHEDULING_AND_ALLOCATION,
    summary: `Appointments for ${prisoner.number}`,
    internalLocationDescription: 'Appointment location',
  },
  {
    prisonerNumber: prisoner.number,
    eventType: EventType.COURT_HEARING,
    eventSource: EventSource.NOMIS,
    summary: `Court hearing for ${prisoner.number}`,
    internalLocationDescription: 'Court hearing location',
  },
  {
    prisonerNumber: prisoner.number,
    eventType: EventType.VISIT,
    eventSource: EventSource.NOMIS,
    summary: `Visit for ${prisoner.number}`,
    internalLocationDescription: 'Visit location',
  },
  {
    prisonerNumber: prisoner.number,
    eventType: EventType.EXTERNAL_TRANSFER,
    eventSource: EventSource.NOMIS,
    summary: `External transfer for ${prisoner.number}`,
    internalLocationDescription: 'External transfer location',
  },
  {
    prisonerNumber: prisoner.number,
    eventType: EventType.ADJUDICATION_HEARING,
    eventSource: EventSource.NOMIS,
    summary: `Adjudication for ${prisoner.number}`,
    internalLocationDescription: 'Adjudication location',
  },
]

describe('Views - Create Appointment - Schedule', () => {
  let compiledTemplate: Template
  let viewContext = {
    session: {
      appointmentJourney: {} as AppointmentJourney,
      bulkAppointmentJourney: {} as BulkAppointmentJourney,
    },
    prisonerSchedules: [{}],
    formResponses: {},
  }

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = nunjucks.compile(view.toString(), njkEnv)
    viewContext = {
      session: {
        appointmentJourney: {
          startDate: {
            day: tomorrow.getDate(),
            month: tomorrow.getMonth() + 1,
            year: tomorrow.getFullYear(),
            date: formatDate(tomorrow, 'yyyy-MM-dd'),
          },
        } as unknown as AppointmentJourney,
        bulkAppointmentJourney: {} as BulkAppointmentJourney,
      },
      prisonerSchedules: [{}],
      formResponses: {},
    }
  })

  describe('Individual Appointment', () => {
    const getIndividualPrisonerValueElement = (qaAttr: string) =>
      getAppointmentDetailsValueElement('Attendee').find(`[data-qa="${qaAttr}"]`)

    beforeEach(() => {
      viewContext.session.appointmentJourney.type = AppointmentType.INDIVIDUAL
      viewContext.session.appointmentJourney.prisoners = [
        { number: 'A1234BC', name: 'TEST PRISONER', cellLocation: '1-1-1' },
      ]
      viewContext.session.appointmentJourney.startTime = {
        hour: 9,
        minute: 0,
        date: formatDate(tomorrow.setHours(9, 0), "yyyy-MM-dd'T'HH:mm:ss") as unknown as Date,
      }
      viewContext.session.appointmentJourney.endTime = {
        hour: 10,
        minute: 30,
        date: formatDate(tomorrow.setHours(10, 30), "yyyy-MM-dd'T'HH:mm:ss") as unknown as Date,
      }
      viewContext.prisonerSchedules = viewContext.session.appointmentJourney.prisoners.map(prisoner => ({
        prisoner,
        scheduledEvents: getScheduledEventsForPrisoner(prisoner),
      }))

      $ = cheerio.load(compiledTemplate.render(viewContext))
    })

    it('should display individual prisoners details with change link', () => {
      expect(getIndividualPrisonerValueElement('prisoner-name').text().trim()).toEqual('Test Prisoner')
      expect(getIndividualPrisonerValueElement('prisoner-number').text().trim()).toEqual('A1234BC')
      expect(getIndividualPrisonerValueElement('prisoner-cell-location').text().trim()).toEqual('1-1-1')
      expect($('[data-qa=change-prisoner]').attr('href')).toEqual('select-prisoner?preserveHistory=true')
    })

    it('should not display attendee count', () => {
      expect(getAppointmentDetailsValueElement('Attendees').length).toEqual(0)
    })

    it('should not display appointments count', () => {
      expect(getAppointmentDetailsValueElement('Appointments').length).toEqual(0)
    })

    it('should display date with change link', () => {
      expect(getAppointmentDetailsValueElement('Date').text().trim()).toEqual(formatDate(tomorrow, 'EEEE, d MMMM yyyy'))
      expect($('[data-qa=change-start-date]').attr('href')).toEqual('date-and-time?preserveHistory=true')
    })

    it('should display time with change link', () => {
      expect(getAppointmentDetailsValueElement('Time').text().trim()).toEqual('09:00 to 10:30')
      expect($('[data-qa=change-time]').attr('href')).toEqual('date-and-time?preserveHistory=true')
    })

    it('should not display top call to action', () => {
      expect($('[data-qa=top-cta]').length).toBe(0)
    })
  })

  describe('Group Appointment', () => {
    beforeEach(() => {
      viewContext.session.appointmentJourney.type = AppointmentType.GROUP
      viewContext.session.appointmentJourney.prisoners = [
        { number: 'A1234BC', name: 'TEST01 PRISONER01', cellLocation: '1-1-1' },
        { number: 'B2345CD', name: 'TEST02 PRISONER02', cellLocation: '1-1-2' },
        { number: 'C3456DE', name: 'TEST03 PRISONER03', cellLocation: '1-1-3' },
        { number: 'D4567EF', name: 'TEST04 PRISONER04', cellLocation: '1-1-4' },
        { number: 'E5678FG', name: 'TEST05 PRISONER05', cellLocation: '1-1-5' },
        { number: 'F6789GH', name: 'TEST06 PRISONER06', cellLocation: '1-1-6' },
        { number: 'G7891HI', name: 'TEST07 PRISONER07', cellLocation: '1-1-7' },
        { number: 'H8912IJ', name: 'TEST08 PRISONER08', cellLocation: '1-1-8' },
        { number: 'I9123JK', name: 'TEST09 PRISONER09', cellLocation: '1-1-9' },
        { number: 'J1234KL', name: 'TEST10 PRISONER10', cellLocation: '1-1-10' },
      ]
      viewContext.session.appointmentJourney.startTime = {
        hour: 14,
        minute: 30,
        date: formatDate(tomorrow.setHours(14, 30), "yyyy-MM-dd'T'HH:mm:ss") as unknown as Date,
      }
      viewContext.session.appointmentJourney.endTime = {
        hour: 16,
        minute: 0,
        date: formatDate(tomorrow.setHours(16, 0), "yyyy-MM-dd'T'HH:mm:ss") as unknown as Date,
      }
      viewContext.prisonerSchedules = viewContext.session.appointmentJourney.prisoners.map(prisoner => ({
        prisoner,
        scheduledEvents: getScheduledEventsForPrisoner(prisoner),
      }))

      $ = cheerio.load(compiledTemplate.render(viewContext))
    })

    it('should not display individual prisoners details', () => {
      expect(getAppointmentDetailsValueElement('Attendee').length).toBe(0)
    })

    it('should display attendee count with change link', () => {
      expect(getAppointmentDetailsValueElement('Attendees').text().trim()).toEqual('10')
      expect($('[data-qa=change-prisoners]').attr('href')).toEqual('review-prisoners?preserveHistory=true')
    })

    it('should not display appointments count', () => {
      expect(getAppointmentDetailsValueElement('Appointments').length).toEqual(0)
    })

    it('should display date with change link', () => {
      expect(getAppointmentDetailsValueElement('Date').text().trim()).toEqual(formatDate(tomorrow, 'EEEE, d MMMM yyyy'))
      expect($('[data-qa=change-start-date]').attr('href')).toEqual('date-and-time?preserveHistory=true')
    })

    it('should display time with change link', () => {
      expect(getAppointmentDetailsValueElement('Time').text().trim()).toEqual('14:30 to 16:00')
      expect($('[data-qa=change-time]').attr('href')).toEqual('date-and-time?preserveHistory=true')
    })

    it('should display top call to action for eleven attendees', () => {
      viewContext.session.appointmentJourney.prisoners.push({
        number: 'K2345LM',
        name: 'TEST11 PRISONER11',
        cellLocation: '1-1-11',
      })
      viewContext.prisonerSchedules.push({
        prisoner: viewContext.session.appointmentJourney.prisoners[10],
        scheduledEvents: getScheduledEventsForPrisoner(viewContext.session.appointmentJourney.prisoners[10]),
      })

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('[data-qa=top-cta]').text().trim()).toBe('Continue')
    })

    it('should not display top call to action for fewer than eleven attendees', () => {
      expect($('[data-qa=top-cta]').length).toBe(0)
    })
  })

  describe('Bulk Appointment', () => {
    beforeEach(() => {
      viewContext.session.appointmentJourney.type = AppointmentType.BULK
      viewContext.session.bulkAppointmentJourney.appointments = [
        {
          startTime: { hour: 9, minute: 0 },
          endTime: { hour: 9, minute: 15 },
          prisoner: { number: 'A1234BC', name: 'TEST01 PRISONER01', cellLocation: '1-1-1' },
        },
        {
          startTime: { hour: 9, minute: 15 },
          endTime: { hour: 9, minute: 30 },
          prisoner: { number: 'B2345CD', name: 'TEST02 PRISONER02', cellLocation: '1-1-2' },
        },
        {
          startTime: { hour: 9, minute: 30 },
          endTime: { hour: 9, minute: 45 },
          prisoner: { number: 'C3456DE', name: 'TEST03 PRISONER03', cellLocation: '1-1-3' },
        },
        {
          startTime: { hour: 9, minute: 45 },
          endTime: { hour: 10, minute: 0 },
          prisoner: { number: 'D4567EF', name: 'TEST04 PRISONER04', cellLocation: '1-1-4' },
        },
        {
          startTime: { hour: 10, minute: 0 },
          endTime: { hour: 10, minute: 15 },
          prisoner: { number: 'E5678FG', name: 'TEST05 PRISONER05', cellLocation: '1-1-5' },
        },
        {
          startTime: { hour: 10, minute: 15 },
          endTime: { hour: 10, minute: 30 },
          prisoner: { number: 'F6789GH', name: 'TEST06 PRISONER06', cellLocation: '1-1-6' },
        },
        {
          startTime: { hour: 10, minute: 30 },
          endTime: { hour: 10, minute: 45 },
          prisoner: { number: 'G7891HI', name: 'TEST07 PRISONER07', cellLocation: '1-1-7' },
        },
        {
          startTime: { hour: 10, minute: 45 },
          endTime: { hour: 11, minute: 0 },
          prisoner: { number: 'H8912IJ', name: 'TEST08 PRISONER08', cellLocation: '1-1-8' },
        },
        {
          startTime: { hour: 11, minute: 0 },
          endTime: { hour: 11, minute: 15 },
          prisoner: { number: 'I9123JK', name: 'TEST09 PRISONER09', cellLocation: '1-1-9' },
        },
        {
          startTime: { hour: 11, minute: 15 },
          endTime: { hour: 11, minute: 30 },
          prisoner: { number: 'J1234KL', name: 'TEST10 PRISONER10', cellLocation: '1-1-10' },
        },
      ]
      viewContext.prisonerSchedules = viewContext.session.bulkAppointmentJourney.appointments.map(appointment => ({
        prisoner: appointment.prisoner,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        scheduledEvents: getScheduledEventsForPrisoner(appointment.prisoner),
      }))

      $ = cheerio.load(compiledTemplate.render(viewContext))
    })

    it('should not display individual prisoners details', () => {
      expect(getAppointmentDetailsValueElement('Attendee').length).toBe(0)
    })

    it('should not display attendee count', () => {
      expect(getAppointmentDetailsValueElement('Attendees').length).toEqual(0)
    })

    it('should display appointments count with change link', () => {
      expect(getAppointmentDetailsValueElement('Appointments').text().trim()).toEqual('10')
      expect($('[data-qa=change-prisoners]').attr('href')).toEqual('review-prisoners?preserveHistory=true')
    })

    it('should display date with change link', () => {
      expect(getAppointmentDetailsValueElement('Date').text().trim()).toEqual(formatDate(tomorrow, 'EEEE, d MMMM yyyy'))
      expect($('[data-qa=change-start-date]').attr('href')).toEqual('bulk-appointment-date?preserveHistory=true')
    })

    it('should not display time', () => {
      expect(getAppointmentDetailsValueElement('Time').length).toEqual(0)
    })

    it('should display top call to action for eleven appointments', () => {
      viewContext.session.bulkAppointmentJourney.appointments.push({
        startTime: { hour: 11, minute: 30 },
        endTime: { hour: 11, minute: 45 },
        prisoner: { number: 'K2345LM', name: 'TEST11 PRISONER11', cellLocation: '1-1-11' },
      })
      viewContext.prisonerSchedules.push({
        prisoner: viewContext.session.bulkAppointmentJourney.appointments[10].prisoner,
        startTime: viewContext.session.bulkAppointmentJourney.appointments[10].startTime,
        endTime: viewContext.session.bulkAppointmentJourney.appointments[10].endTime,
        scheduledEvents: getScheduledEventsForPrisoner(
          viewContext.session.bulkAppointmentJourney.appointments[10].prisoner,
        ),
      })

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('[data-qa=top-cta]').text().trim()).toBe('Continue')
    })

    it('should not display top call to action for fewer than eleven appointments', () => {
      expect($('[data-qa=top-cta]').length).toBe(0)
    })
  })
})
