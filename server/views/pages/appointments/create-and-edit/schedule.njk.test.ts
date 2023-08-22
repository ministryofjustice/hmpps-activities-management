import * as cheerio from 'cheerio'
import { CheerioAPI } from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import fs from 'fs'
import { addDays } from 'date-fns'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'
import {
  AppointmentJourney,
  AppointmentJourneyMode,
  AppointmentType,
} from '../../../../routes/appointments/create-and-edit/appointmentJourney'
import { BulkAppointmentJourney } from '../../../../routes/appointments/create-and-edit/bulkAppointmentJourney'
import { EventSource, EventType } from '../../../../@types/activities'
import { convertToTitleCase, formatDate, padNumber } from '../../../../utils/utils'
import { EditAppointmentJourney } from '../../../../routes/appointments/create-and-edit/editAppointmentJourney'

let $: CheerioAPI
const view = fs.readFileSync('server/views/pages/appointments/create-and-edit/schedule.njk')

const tomorrow = addDays(new Date(), 1)
const nextWeek = addDays(new Date(), 7)

const getAppointmentDetailsValueElement = (heading: string) =>
  $('[data-qa=appointment-details] > .govuk-summary-list__row > .govuk-summary-list__key')
    .filter((index, element) => $(element).text().trim() === heading)
    .parent()
    .find('.govuk-summary-list__value')

const getDisplayedEventsForPrisoner = (prisoner: { number: string }) => {
  const displayedEvents: { time: string; eventName: string; type: string; location: string }[] = []

  $(`[data-qa=prison-number-${prisoner.number}-schedule] > tbody > tr`).map((index, element) =>
    displayedEvents.push({
      time: $(element).children('td:eq(0)').text().trim(),
      eventName: $(element).children('td:eq(1)').text().trim(),
      type: $(element).children('td:eq(2)').text().trim(),
      location: $(element).children('td:eq(3)').text().trim(),
    }),
  )

  return displayedEvents
}

const getScheduledEventsForPrisoner = (prisoner: { number: string }) => [
  {
    prisonerNumber: prisoner.number,
    eventType: EventType.ACTIVITY,
    eventSource: EventSource.SCHEDULING_AND_ALLOCATION,
    summary: `Activity for ${prisoner.number}`,
    internalLocationDescription: 'Activity location',
    inCell: false,
    onWing: false,
    startTime: '09:00',
    endTime: '12:00',
  },
  {
    prisonerNumber: prisoner.number,
    eventType: EventType.APPOINTMENT,
    eventSource: EventSource.SCHEDULING_AND_ALLOCATION,
    summary: `Appointment for ${prisoner.number}`,
    internalLocationDescription: 'Appointment location',
    inCell: false,
    onWing: false,
    startTime: '13:00',
    endTime: '14:30',
  },
  {
    prisonerNumber: prisoner.number,
    eventType: EventType.COURT_HEARING,
    eventSource: EventSource.NOMIS,
    summary: `Court hearing for ${prisoner.number}`,
    internalLocationDescription: 'Court hearing location',
    inCell: false,
    onWing: false,
    startTime: '10:30',
    endTime: '11:00',
  },
  {
    prisonerNumber: prisoner.number,
    eventType: EventType.VISIT,
    eventSource: EventSource.NOMIS,
    summary: `Visit for ${prisoner.number}`,
    internalLocationDescription: 'Visit location',
    inCell: false,
    onWing: false,
    startTime: '15:00',
    endTime: '15:30',
  },
  {
    prisonerNumber: prisoner.number,
    eventType: EventType.EXTERNAL_TRANSFER,
    eventSource: EventSource.NOMIS,
    summary: `External transfer for ${prisoner.number}`,
    internalLocationDescription: 'External transfer location',
    inCell: false,
    onWing: false,
    startTime: '08:00',
  },
  {
    prisonerNumber: prisoner.number,
    eventType: EventType.ADJUDICATION_HEARING,
    eventSource: EventSource.NOMIS,
    summary: `Adjudication for ${prisoner.number}`,
    internalLocationDescription: 'Adjudication location',
    inCell: false,
    onWing: false,
    startTime: '10:00',
    endTime: '11:00',
  },
]

describe('Views - Create Appointment - Schedule', () => {
  let compiledTemplate: Template
  let viewContext = {
    session: {
      appointmentJourney: {} as AppointmentJourney,
      bulkAppointmentJourney: {} as BulkAppointmentJourney,
      editAppointmentJourney: {} as EditAppointmentJourney,
    },
    prisonerSchedules: [] as {
      prisoner: { number: string; name: string; cellLocation: string }
      startTime?: { hour: number; minute: number }
      endTime?: { hour: number; minute: number }
      scheduledEvents: {
        prisonerNumber: string
        eventType: string
        eventSource: string
        summary: string
        internalLocationDescription: string
        inCell: boolean
        onWing: boolean
        startTime: string
        endTime?: string
      }[]
    }[],
    formResponses: {},
    isCtaAcceptAndSave: false,
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
        editAppointmentJourney: {} as EditAppointmentJourney,
      },
      prisonerSchedules: [],
      formResponses: {},
      isCtaAcceptAndSave: false,
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
      expect($('[data-qa=change-prisoner]').attr('href')).toEqual(
        'change?property=select-prisoner&preserveHistory=true',
      )
    })

    it('should not display attendee count', () => {
      expect(getAppointmentDetailsValueElement('Attendees').length).toEqual(0)
    })

    it('should not display appointments count', () => {
      expect(getAppointmentDetailsValueElement('Appointments').length).toEqual(0)
    })

    it('should display date with change link', () => {
      expect(getAppointmentDetailsValueElement('Date').text().trim()).toEqual(formatDate(tomorrow, 'EEEE, d MMMM yyyy'))
      expect($('[data-qa=change-start-date]').attr('href')).toEqual(
        'change?property=date-and-time&preserveHistory=true',
      )
    })

    it('should display time with change link', () => {
      expect(getAppointmentDetailsValueElement('Time').text().trim()).toEqual('09:00 to 10:30')
      expect($('[data-qa=change-time]').attr('href')).toEqual('change?property=date-and-time&preserveHistory=true')
    })

    it('should not display top call to action', () => {
      expect($('[data-qa=top-cta]').length).toBe(0)
    })

    it('should display continue CTA during create journey', () => {
      expect($('[data-qa=bottom-cta]').text().trim()).toEqual('Continue')
    })

    it('should display events for attendee heading', () => {
      expect($('[data-qa=schedule-heading]').text().trim()).toEqual(
        `Events for Test Prisoner, A1234BC on ${formatDate(tomorrow, 'EEEE, d MMMM yyyy')}`,
      )
    })

    it('should not display attendee events heading', () => {
      expect($('[data-qa=schedules-heading]').length).toEqual(0)
    })

    it('should not use summary card for attendee', () => {
      expect($('.govuk-summary-card').length).toBe(0)
    })

    it('should display no other events scheduled', () => {
      viewContext.prisonerSchedules[0].scheduledEvents = []

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect(
        $(`[data-qa=no-events-for-prison-number-${viewContext.prisonerSchedules[0].prisoner.number}]`).text().trim(),
      ).toEqual('No other events scheduled.')
    })

    it('should display scheduled events', () => {
      const displayedEvents = getDisplayedEventsForPrisoner(viewContext.prisonerSchedules[0].prisoner)

      expect(displayedEvents).toEqual([
        {
          time: '09:00 to 12:00',
          eventName: 'Activity for A1234BC',
          type: 'Activity',
          location: 'Activity location',
        },
        {
          time: '13:00 to 14:30',
          eventName: 'Appointment for A1234BC',
          type: 'Appointment',
          location: 'Appointment location',
        },
        {
          time: '',
          eventName: 'Court hearing for A1234BC',
          type: 'Court hearing',
          location: '',
        },
        {
          time: '15:00 to 15:30',
          eventName: 'Visit for A1234BC',
          type: 'Visit',
          location: 'Visit location',
        },
        {
          time: '',
          eventName: 'External transfer for A1234BC',
          type: 'External transfer',
          location: '',
        },
        {
          time: '10:00 to 11:00',
          eventName: 'Adjudication for A1234BC',
          type: 'Adjudication hearing',
          location: 'Adjudication location',
        },
      ])
    })

    it('should display in cell event', () => {
      viewContext.prisonerSchedules[0].scheduledEvents = [
        {
          prisonerNumber: viewContext.prisonerSchedules[0].prisoner.number,
          eventType: EventType.APPOINTMENT,
          eventSource: EventSource.SCHEDULING_AND_ALLOCATION,
          summary: `Appointment for ${viewContext.prisonerSchedules[0].prisoner.number}`,
          internalLocationDescription: 'Appointment location',
          inCell: true,
          onWing: false,
          startTime: '13:00',
          endTime: '14:30',
        },
      ]

      $ = cheerio.load(compiledTemplate.render(viewContext))

      const displayedEvents = getDisplayedEventsForPrisoner(viewContext.prisonerSchedules[0].prisoner)

      expect(displayedEvents).toEqual([
        {
          time: '13:00 to 14:30',
          eventName: 'Appointment for A1234BC',
          type: 'Appointment',
          location: 'In cell',
        },
      ])
    })

    it('should display on wing event', () => {
      viewContext.prisonerSchedules[0].scheduledEvents = [
        {
          prisonerNumber: viewContext.prisonerSchedules[0].prisoner.number,
          eventType: EventType.APPOINTMENT,
          eventSource: EventSource.SCHEDULING_AND_ALLOCATION,
          summary: `Appointment for ${viewContext.prisonerSchedules[0].prisoner.number}`,
          internalLocationDescription: 'Appointment location',
          inCell: false,
          onWing: true,
          startTime: '13:00',
          endTime: '14:30',
        },
      ]

      $ = cheerio.load(compiledTemplate.render(viewContext))

      const displayedEvents = getDisplayedEventsForPrisoner(viewContext.prisonerSchedules[0].prisoner)

      expect(displayedEvents).toEqual([
        {
          time: '13:00 to 14:30',
          eventName: 'Appointment for A1234BC',
          type: 'Appointment',
          location: 'On wing',
        },
      ])
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
      expect($('[data-qa=change-prisoners]').attr('href')).toEqual(
        'change?property=review-prisoners&preserveHistory=true',
      )
    })

    it('should not display appointments count', () => {
      expect(getAppointmentDetailsValueElement('Appointments').length).toEqual(0)
    })

    it('should display date with change link', () => {
      expect(getAppointmentDetailsValueElement('Date').text().trim()).toEqual(formatDate(tomorrow, 'EEEE, d MMMM yyyy'))
      expect($('[data-qa=change-start-date]').attr('href')).toEqual(
        'change?property=date-and-time&preserveHistory=true',
      )
    })

    it('should display time with change link', () => {
      expect(getAppointmentDetailsValueElement('Time').text().trim()).toEqual('14:30 to 16:00')
      expect($('[data-qa=change-time]').attr('href')).toEqual('change?property=date-and-time&preserveHistory=true')
    })

    it('should display "Continue" top call to action for eleven attendees', () => {
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

    it('should display "Continue" bottom CTA during create journey', () => {
      expect($('[data-qa=bottom-cta]').text().trim()).toEqual('Continue')
    })

    it('should not display events for attendee heading', () => {
      expect($('[data-qa=schedule-heading]').length).toEqual(0)
    })

    it('should not display attendee events heading', () => {
      expect($('[data-qa=schedules-heading]').text().trim()).toEqual(
        `Attendee events on ${formatDate(tomorrow, 'EEEE, d MMMM yyyy')}`,
      )
    })

    it('should use summary cards for attendees', () => {
      expect($('.govuk-summary-card').length).toBe(10)
    })

    it('should display events for attendee titles', () => {
      viewContext.prisonerSchedules.forEach(prisonerSchedule => {
        expect(
          $(`[data-qa=schedule-card-title-prison-number-${prisonerSchedule.prisoner.number}]`).text().trim(),
        ).toEqual(`${convertToTitleCase(prisonerSchedule.prisoner.name)}, ${prisonerSchedule.prisoner.number}`)
      })
    })

    it('should display remove attendee links', () => {
      viewContext.prisonerSchedules.forEach(prisonerSchedule => {
        const link = $(`[data-qa=remove-prison-number-${prisonerSchedule.prisoner.number}]`)
        expect(link.text()).toContain('Remove attendee')
        expect(link.attr('href')).toEqual(`schedule/${prisonerSchedule.prisoner.number}/remove`)
      })
    })

    it('should not display change time links', () => {
      viewContext.prisonerSchedules.forEach(prisonerSchedule => {
        expect($(`[data-qa=change-appointment-time-prison-number-${prisonerSchedule.prisoner.number}]`).length).toBe(0)
      })
    })

    it('should not display remove appointment links', () => {
      viewContext.prisonerSchedules.forEach(prisonerSchedule => {
        expect($(`[data-qa=remove-appointment-prison-number-${prisonerSchedule.prisoner.number}]`).length).toBe(0)
      })
    })

    it('should display no other events scheduled', () => {
      viewContext.prisonerSchedules[0].scheduledEvents = []

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect(
        $(`[data-qa=no-events-for-prison-number-${viewContext.prisonerSchedules[0].prisoner.number}]`).text().trim(),
      ).toEqual('No other events scheduled')
    })

    it('should only display list is empty and someone must be added when attendee list is empty', () => {
      viewContext.session.appointmentJourney.prisoners = []
      viewContext.prisonerSchedules = []

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('form').length).toBe(0)
      expect($('h1').text().trim()).toEqual('There are no attendees for this appointment')
      const paragraphs = $('p')
      expect(paragraphs.text()).toContain('You’ve removed the last attendee for this appointment.')
      expect(paragraphs.text()).toContain('You need to add someone to continue scheduling it.')
      const cta = $('.govuk-button')
      expect(cta.text().trim()).toBe('Add someone to the list')
      expect(cta.attr('href')).toBe('how-to-add-prisoners?preserveHistory=true')
    })

    it('should display scheduled events', () => {
      const displayedEvents = getDisplayedEventsForPrisoner(viewContext.prisonerSchedules[0].prisoner)

      expect(displayedEvents).toEqual([
        {
          time: '09:00 to 12:00',
          eventName: 'Activity for A1234BC',
          type: 'Activity',
          location: 'Activity location',
        },
        {
          time: '13:00 to 14:30',
          eventName: 'Appointment for A1234BC',
          type: 'Appointment',
          location: 'Appointment location',
        },
        {
          time: '',
          eventName: 'Court hearing for A1234BC',
          type: 'Court hearing',
          location: '',
        },
        {
          time: '15:00 to 15:30',
          eventName: 'Visit for A1234BC',
          type: 'Visit',
          location: 'Visit location',
        },
        {
          time: '',
          eventName: 'External transfer for A1234BC',
          type: 'External transfer',
          location: '',
        },
        {
          time: '10:00 to 11:00',
          eventName: 'Adjudication for A1234BC',
          type: 'Adjudication hearing',
          location: 'Adjudication location',
        },
      ])
    })

    it('should display in cell event', () => {
      viewContext.prisonerSchedules[0].scheduledEvents = [
        {
          prisonerNumber: viewContext.prisonerSchedules[0].prisoner.number,
          eventType: EventType.APPOINTMENT,
          eventSource: EventSource.SCHEDULING_AND_ALLOCATION,
          summary: `Appointment for ${viewContext.prisonerSchedules[0].prisoner.number}`,
          internalLocationDescription: 'Appointment location',
          inCell: true,
          onWing: false,
          startTime: '13:00',
          endTime: '14:30',
        },
      ]

      $ = cheerio.load(compiledTemplate.render(viewContext))

      const displayedEvents = getDisplayedEventsForPrisoner(viewContext.prisonerSchedules[0].prisoner)

      expect(displayedEvents).toEqual([
        {
          time: '13:00 to 14:30',
          eventName: 'Appointment for A1234BC',
          type: 'Appointment',
          location: 'In cell',
        },
      ])
    })

    it('should display on wing event', () => {
      viewContext.prisonerSchedules[0].scheduledEvents = [
        {
          prisonerNumber: viewContext.prisonerSchedules[0].prisoner.number,
          eventType: EventType.APPOINTMENT,
          eventSource: EventSource.SCHEDULING_AND_ALLOCATION,
          summary: `Appointment for ${viewContext.prisonerSchedules[0].prisoner.number}`,
          internalLocationDescription: 'Appointment location',
          inCell: false,
          onWing: true,
          startTime: '13:00',
          endTime: '14:30',
        },
      ]

      $ = cheerio.load(compiledTemplate.render(viewContext))

      const displayedEvents = getDisplayedEventsForPrisoner(viewContext.prisonerSchedules[0].prisoner)

      expect(displayedEvents).toEqual([
        {
          time: '13:00 to 14:30',
          eventName: 'Appointment for A1234BC',
          type: 'Appointment',
          location: 'On wing',
        },
      ])
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

    it('should display appointments count without a change link', () => {
      expect(getAppointmentDetailsValueElement('Appointments').text().trim()).toEqual('10')
      expect($('[data-qa=change-prisoners]').length).toEqual(0)
    })

    it('should display date with change link', () => {
      expect(getAppointmentDetailsValueElement('Date').text().trim()).toEqual(formatDate(tomorrow, 'EEEE, d MMMM yyyy'))
      expect($('[data-qa=change-start-date]').attr('href')).toEqual(
        'change?property=bulk-appointment-date&preserveHistory=true',
      )
    })

    it('should not display time', () => {
      expect(getAppointmentDetailsValueElement('Time').length).toEqual(0)
    })

    it('should display "Continue" top call to action for eleven appointments', () => {
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

    it('should display "Continue" bottom CTA during create journey', () => {
      expect($('[data-qa=bottom-cta]').text().trim()).toEqual('Continue')
    })

    it('should not display events for attendee heading', () => {
      expect($('[data-qa=schedule-heading]').length).toEqual(0)
    })

    it('should not display attendee events heading', () => {
      expect($('[data-qa=schedules-heading]').text().trim()).toEqual(
        `Attendee events on ${formatDate(tomorrow, 'EEEE, d MMMM yyyy')}`,
      )
    })

    it('should use summary cards for appointments', () => {
      expect($('.govuk-summary-card').length).toBe(10)
    })

    it('should display events for attendee titles', () => {
      viewContext.prisonerSchedules.forEach(prisonerSchedule => {
        expect(
          $(`[data-qa=schedule-card-title-prison-number-${prisonerSchedule.prisoner.number}] > ul > li:eq(0)`)
            .text()
            .trim(),
        ).toEqual(`${convertToTitleCase(prisonerSchedule.prisoner.name)}, ${prisonerSchedule.prisoner.number}`)
        expect(
          $(`[data-qa=schedule-card-title-prison-number-${prisonerSchedule.prisoner.number}] > ul > li:eq(1)`)
            .text()
            .trim(),
        ).toEqual(
          `${padNumber(prisonerSchedule.startTime.hour)}:${padNumber(prisonerSchedule.startTime.minute)} to ${padNumber(
            prisonerSchedule.endTime.hour,
          )}:${padNumber(prisonerSchedule.endTime.minute)}`,
        )
      })
    })

    it('should not display remove attendee links', () => {
      viewContext.prisonerSchedules.forEach(prisonerSchedule => {
        expect($(`[data-qa=remove-prison-number-${prisonerSchedule.prisoner.number}]`).length).toBe(0)
      })
    })

    it('should display change time links', () => {
      viewContext.prisonerSchedules.forEach(prisonerSchedule => {
        const link = $(`[data-qa=change-appointment-time-prison-number-${prisonerSchedule.prisoner.number}]`)
        expect(link.text()).toContain('Change time')
        expect(link.attr('href')).toEqual('review-bulk-appointment?preserveHistory=true')
      })
    })

    it('should display remove appointment links', () => {
      viewContext.prisonerSchedules.forEach(prisonerSchedule => {
        const link = $(`[data-qa=remove-appointment-prison-number-${prisonerSchedule.prisoner.number}]`)
        expect(link.text()).toContain('Remove appointment')
        expect(link.attr('href')).toEqual(`schedule/${prisonerSchedule.prisoner.number}/remove`)
      })
    })

    it('should display no other events scheduled', () => {
      viewContext.prisonerSchedules[0].scheduledEvents = []

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect(
        $(`[data-qa=no-events-for-prison-number-${viewContext.prisonerSchedules[0].prisoner.number}]`).text().trim(),
      ).toEqual('No other events scheduled')
    })

    it('should only display list is empty and someone must be added when attendee list is empty', () => {
      viewContext.session.bulkAppointmentJourney.appointments = []
      viewContext.prisonerSchedules = []

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('form').length).toBe(0)
      expect($('h1').text().trim()).toEqual('There are no attendees for this set')
      const paragraphs = $('p')
      expect(paragraphs.text()).toContain('You’ve removed the last attendee for this set of appointments.')
      expect(paragraphs.text()).toContain(
        'You need to add a new list of prison numbers to continue scheduling the set of back-to-backs.',
      )
      const cta = $('.govuk-button')
      expect(cta.text().trim()).toBe('Add a new list')
      expect(cta.attr('href')).toBe('upload-bulk-appointment?preserveHistory=true')
    })

    it('should display scheduled events', () => {
      const displayedEvents = getDisplayedEventsForPrisoner(viewContext.prisonerSchedules[0].prisoner)

      expect(displayedEvents).toEqual([
        {
          time: '09:00 to 12:00',
          eventName: 'Activity for A1234BC',
          type: 'Activity',
          location: 'Activity location',
        },
        {
          time: '13:00 to 14:30',
          eventName: 'Appointment for A1234BC',
          type: 'Appointment',
          location: 'Appointment location',
        },
        {
          time: '',
          eventName: 'Court hearing for A1234BC',
          type: 'Court hearing',
          location: '',
        },
        {
          time: '15:00 to 15:30',
          eventName: 'Visit for A1234BC',
          type: 'Visit',
          location: 'Visit location',
        },
        {
          time: '',
          eventName: 'External transfer for A1234BC',
          type: 'External transfer',
          location: '',
        },
        {
          time: '10:00 to 11:00',
          eventName: 'Adjudication for A1234BC',
          type: 'Adjudication hearing',
          location: 'Adjudication location',
        },
      ])
    })

    it('should display in cell event', () => {
      viewContext.prisonerSchedules[0].scheduledEvents = [
        {
          prisonerNumber: viewContext.prisonerSchedules[0].prisoner.number,
          eventType: EventType.APPOINTMENT,
          eventSource: EventSource.SCHEDULING_AND_ALLOCATION,
          summary: `Appointment for ${viewContext.prisonerSchedules[0].prisoner.number}`,
          internalLocationDescription: 'Appointment location',
          inCell: true,
          onWing: false,
          startTime: '13:00',
          endTime: '14:30',
        },
      ]

      $ = cheerio.load(compiledTemplate.render(viewContext))

      const displayedEvents = getDisplayedEventsForPrisoner(viewContext.prisonerSchedules[0].prisoner)

      expect(displayedEvents).toEqual([
        {
          time: '13:00 to 14:30',
          eventName: 'Appointment for A1234BC',
          type: 'Appointment',
          location: 'In cell',
        },
      ])
    })

    it('should display on wing event', () => {
      viewContext.prisonerSchedules[0].scheduledEvents = [
        {
          prisonerNumber: viewContext.prisonerSchedules[0].prisoner.number,
          eventType: EventType.APPOINTMENT,
          eventSource: EventSource.SCHEDULING_AND_ALLOCATION,
          summary: `Appointment for ${viewContext.prisonerSchedules[0].prisoner.number}`,
          internalLocationDescription: 'Appointment location',
          inCell: false,
          onWing: true,
          startTime: '13:00',
          endTime: '14:30',
        },
      ]

      $ = cheerio.load(compiledTemplate.render(viewContext))

      const displayedEvents = getDisplayedEventsForPrisoner(viewContext.prisonerSchedules[0].prisoner)

      expect(displayedEvents).toEqual([
        {
          time: '13:00 to 14:30',
          eventName: 'Appointment for A1234BC',
          type: 'Appointment',
          location: 'On wing',
        },
      ])
    })
  })

  describe('Edit Appointment', () => {
    beforeEach(() => {
      viewContext.session.appointmentJourney = {
        mode: AppointmentJourneyMode.EDIT,
        startDate: {
          day: tomorrow.getDate(),
          month: tomorrow.getMonth() + 1,
          year: tomorrow.getFullYear(),
          date: formatDate(tomorrow, 'yyyy-MM-dd') as unknown as Date,
        },
        startTime: {
          hour: 14,
          minute: 30,
          date: formatDate(tomorrow.setHours(14, 30), "yyyy-MM-dd'T'HH:mm:ss") as unknown as Date,
        },
        endTime: {
          hour: 16,
          minute: 0,
          date: formatDate(tomorrow.setHours(16, 0), "yyyy-MM-dd'T'HH:mm:ss") as unknown as Date,
        },
      } as AppointmentJourney
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
      viewContext.prisonerSchedules = viewContext.session.appointmentJourney.prisoners.map(prisoner => ({
        prisoner,
        scheduledEvents: getScheduledEventsForPrisoner(prisoner),
      }))
      viewContext.session.editAppointmentJourney = {} as EditAppointmentJourney
    })

    describe('Add prisoners', () => {
      beforeEach(() => {
        viewContext.isCtaAcceptAndSave = true
        viewContext.session.editAppointmentJourney.addPrisoners = [
          {
            number: 'A1234BC',
            name: 'TEST01 PRISONER01',
            cellLocation: '1-1-1',
          },
        ]
        viewContext.prisonerSchedules = viewContext.session.editAppointmentJourney.addPrisoners.map(prisoner => ({
          prisoner,
          scheduledEvents: getScheduledEventsForPrisoner(prisoner),
        }))

        $ = cheerio.load(compiledTemplate.render(viewContext))
      })

      it('should display "Attendees you are adding"', () => {
        expect(getAppointmentDetailsValueElement('Attendees you are adding').text().trim()).toEqual('1')
      })

      it('should not display "Appointment name"', () => {
        expect(getAppointmentDetailsValueElement('Appointment name').length).toEqual(0)
      })

      it('should display "Date" without change links', () => {
        expect(getAppointmentDetailsValueElement('Date').text().trim()).toEqual(
          formatDate(tomorrow, 'EEEE, d MMMM yyyy'),
        )
        expect($('[data-qa=change-start-date]').length).toEqual(0)
      })

      it('should display "Time" without change links', () => {
        expect(getAppointmentDetailsValueElement('Time').text().trim()).toEqual('14:30 to 16:00')
        expect($('[data-qa=change-time]').length).toEqual(0)
      })

      it('should display remove attendee links', () => {
        viewContext.prisonerSchedules.forEach(prisonerSchedule => {
          const link = $(`[data-qa=remove-prison-number-${prisonerSchedule.prisoner.number}]`)
          expect(link.text()).toContain('Remove attendee')
          expect(link.attr('href')).toEqual(`schedule/${prisonerSchedule.prisoner.number}/remove`)
        })
      })

      it('should display "Confirm" top call to action when adding eleven attendees', () => {
        viewContext.session.editAppointmentJourney.addPrisoners = Array(11).map((v, i) => ({
          number: `A1234BC${i}`,
          name: `TEST PRISONER${i}`,
          cellLocation: '1-1-1',
        }))
        viewContext.prisonerSchedules = viewContext.session.editAppointmentJourney.addPrisoners.map(v => ({
          prisoner: v,
          scheduledEvents: getScheduledEventsForPrisoner(v),
        }))

        $ = cheerio.load(compiledTemplate.render(viewContext))

        expect($('[data-qa=top-cta]').text().trim()).toBe('Confirm')
      })

      it('should display confirm CTA when adding prisoners to appointment', () => {
        expect($('button').text().trim()).toEqual('Confirm')
      })
    })

    describe('Edit date', () => {
      beforeEach(() => {
        viewContext.isCtaAcceptAndSave = true
        viewContext.session.editAppointmentJourney = {
          startDate: {
            day: nextWeek.getDate(),
            month: nextWeek.getMonth() + 1,
            year: nextWeek.getFullYear(),
            date: formatDate(nextWeek, 'yyyy-MM-dd'),
          },
        } as unknown as EditAppointmentJourney
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
      })

      it('should not display "Attendees you are adding"', () => {
        expect(getAppointmentDetailsValueElement('Attendees you are adding').length).toEqual(0)
      })

      it('should not display "Appointment name"', () => {
        expect(getAppointmentDetailsValueElement('Appointment name').length).toEqual(0)
      })

      it('should display "Date" with new value and change link', () => {
        expect(getAppointmentDetailsValueElement('Date').text().trim()).toEqual(
          formatDate(nextWeek, 'EEEE, d MMMM yyyy'),
        )
        expect($('[data-qa=change-start-date]').attr('href')).toEqual(
          'change?property=date-and-time&preserveHistory=true',
        )
      })

      it('should display "Time" with change link', () => {
        expect(getAppointmentDetailsValueElement('Time').text().trim()).toEqual('14:30 to 16:00')
        expect($('[data-qa=change-time]').attr('href')).toEqual('change?property=date-and-time&preserveHistory=true')
      })

      it('should not display remove attendee links', () => {
        viewContext.prisonerSchedules.forEach(prisonerSchedule => {
          const link = $(`[data-qa=remove-prison-number-${prisonerSchedule.prisoner.number}]`)
          expect(link.length).toEqual(0)
        })
      })

      it('should display "Update date" call to action buttons', () => {
        expect($('[data-qa=top-cta]').text().trim()).toEqual('Update date')
        expect($('[data-qa=bottom-cta]').text().trim()).toEqual('Update date')
      })
    })

    describe('Edit time', () => {
      beforeEach(() => {
        viewContext.isCtaAcceptAndSave = true
        viewContext.session.editAppointmentJourney = {
          startTime: {
            hour: 12,
            minute: 30,
            date: formatDate(tomorrow.setHours(12, 30), "yyyy-MM-dd'T'HH:mm:ss") as unknown as Date,
          },
          endTime: {
            hour: 16,
            minute: 0,
            date: formatDate(tomorrow.setHours(16, 0), "yyyy-MM-dd'T'HH:mm:ss") as unknown as Date,
          },
        } as unknown as EditAppointmentJourney
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
      })

      it('should not display "Attendees you are adding"', () => {
        expect(getAppointmentDetailsValueElement('Attendees you are adding').length).toEqual(0)
      })

      it('should not display "Appointment name"', () => {
        expect(getAppointmentDetailsValueElement('Appointment name').length).toEqual(0)
      })

      it('should display "Date" with change link', () => {
        expect(getAppointmentDetailsValueElement('Date').text().trim()).toEqual(
          formatDate(tomorrow, 'EEEE, d MMMM yyyy'),
        )
        expect($('[data-qa=change-start-date]').attr('href')).toEqual(
          'change?property=date-and-time&preserveHistory=true',
        )
      })

      it('should display "Time" with new value and change link', () => {
        expect(getAppointmentDetailsValueElement('Time').text().trim()).toEqual('12:30 to 16:00')
        expect($('[data-qa=change-time]').attr('href')).toEqual('change?property=date-and-time&preserveHistory=true')
      })

      it('should not display remove attendee links', () => {
        viewContext.prisonerSchedules.forEach(prisonerSchedule => {
          const link = $(`[data-qa=remove-prison-number-${prisonerSchedule.prisoner.number}]`)
          expect(link.length).toEqual(0)
        })
      })

      it('should display "Update time" call to action buttons', () => {
        expect($('[data-qa=top-cta]').text().trim()).toEqual('Update time')
        expect($('[data-qa=bottom-cta]').text().trim()).toEqual('Update time')
      })
    })

    describe('Edit date and time', () => {
      beforeEach(() => {
        viewContext.isCtaAcceptAndSave = true
        viewContext.session.editAppointmentJourney = {
          startDate: {
            day: nextWeek.getDate(),
            month: nextWeek.getMonth() + 1,
            year: nextWeek.getFullYear(),
            date: formatDate(nextWeek, 'yyyy-MM-dd'),
          },
          startTime: {
            hour: 12,
            minute: 30,
            date: formatDate(tomorrow.setHours(12, 30), "yyyy-MM-dd'T'HH:mm:ss") as unknown as Date,
          },
          endTime: {
            hour: 16,
            minute: 0,
            date: formatDate(tomorrow.setHours(16, 0), "yyyy-MM-dd'T'HH:mm:ss") as unknown as Date,
          },
        } as unknown as EditAppointmentJourney
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
      })

      it('should display "Update date and time" call to action buttons', () => {
        expect($('[data-qa=top-cta]').text().trim()).toEqual('Update date and time')
        expect($('[data-qa=bottom-cta]').text().trim()).toEqual('Update date and time')
      })
    })
  })
})
