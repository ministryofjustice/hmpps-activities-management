import * as cheerio from 'cheerio'
import { CheerioAPI } from 'cheerio'
import { compile, Template } from 'nunjucks'
import { registerNunjucks } from '../../../nunjucks/nunjucksSetup'

let $: CheerioAPI

describe('show otherEvent macro', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    const view = `
      {% from "partials/attendance/otherEvent.njk" import otherEvent %}
      {{ otherEvent(event, attendanceListDesign) }}`
    compiledTemplate = compile(view, njkEnv)
  })

  describe('', () => {
    it('should display the correct info if not using the attendance list design - activity', () => {
      const viewContext = {
        event: {
          startTime: '08:30',
          endTime: '11:45',
          eventType: 'ACTIVITY',
          eventSource: 'SAA',
          summary: 'ED1 - FSE L2 AM',
          appointmentId: '1',
          cancelled: false,
          attendanceStatus: 'WAITING',
          issuePayment: null,
          paid: true,
          attendanceReasonCode: null,
          inCell: true,
        },
        attendanceListDesign: false,
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).toContain('08:30 to 11:45:')
      expect($('body').text()).toContain('ED1 - FSE L2 AM')
      expect($('body').text()).toContain('In cell')
      expect($('body').text()).not.toContain('Cancelled')
    })
    it('should display the correct info if not using the attendance list design - appointment', () => {
      const viewContext = {
        event: {
          startTime: '08:30',
          endTime: '11:45',
          eventType: 'APPOINTMENT',
          eventSource: 'SAA',
          summary: 'Dentist',
          appointmentId: '1',
          cancelled: false,
          attendanceStatus: 'WAITING',
          issuePayment: null,
          paid: true,
          attendanceReasonCode: null,
          inCell: true,
        },
        attendanceListDesign: false,
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).toContain('Appointment')
      expect($('body').text()).toContain('Dentist')
      expect($('body').text()).toContain('(opens in new tab)')
      expect($('body').text()).toContain('08:30 to 11:45:')
      expect($('body').text()).toContain('In cell')
      expect($('body').text()).not.toContain('Cancelled')
    })
    it('should display the correct info with the attendance list design - appointment', () => {
      const viewContext = {
        event: {
          startTime: '08:30',
          endTime: '11:45',
          eventType: 'APPOINTMENT',
          eventSource: 'SAA',
          summary: 'Dentist',
          appointmentId: '1',
          cancelled: false,
          attendanceStatus: 'WAITING',
          issuePayment: null,
          paid: true,
          attendanceReasonCode: null,
          inCell: true,
        },
        attendanceListDesign: true,
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).toContain('Appointment')
      expect($('body').text()).toContain('Dentist')
      expect($('body').text()).toContain('(opens in new tab)')
      expect($('body').text()).not.toContain('08:30 to 11:45:') // colon shows its not the attendanceListDesign
      expect($('body').text()).toContain('08:30 to 11:45')
      expect($('body').text()).toContain('In cell')
      expect($('body').text()).not.toContain('Cancelled')
    })
    it('should display the correct info if using the attendance list design - cancelled', () => {
      const viewContext = {
        event: {
          startTime: '08:30',
          endTime: '11:45',
          eventType: 'APPOINTMENT',
          eventSource: 'SAA',
          summary: 'Doctors',
          appointmentId: '1',
          cancelled: true,
          attendanceStatus: 'WAITING',
          issuePayment: null,
          paid: true,
          attendanceReasonCode: null,
          inCell: true,
        },
        attendanceListDesign: true,
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).toContain('Appointment')
      expect($('body').text()).toContain('Doctors')
      expect($('body').text()).toContain('(opens in new tab)')
      expect($('body').text()).toContain('08:30 to 11:45')
      expect($('body').text()).not.toContain('08:30 to 11:45:')
      expect($('body').text()).toContain('In cell')
      expect($('body').text()).toContain('Cancelled')
    })
    it('should display event summary without link if eventSource is not SAA', () => {
      const viewContext = {
        event: {
          startTime: '08:30',
          endTime: '11:45',
          eventType: 'APPOINTMENT',
          eventSource: 'Something else',
          summary: 'Doctors',
          appointmentId: '1',
          cancelled: true,
          attendanceStatus: 'WAITING',
          issuePayment: null,
          paid: true,
          attendanceReasonCode: null,
          inCell: true,
        },
        attendanceListDesign: true,
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).toContain('Doctors')
      expect($('body').text()).not.toContain('(opens in new tab)')
    })
    it('should not display location if the event type is external transfer', () => {
      const viewContext = {
        event: {
          startTime: '08:30',
          endTime: '11:45',
          eventType: 'EXTERNAL_TRANSFER',
          eventSource: 'SAA',
          summary: 'Doctors',
          appointmentId: '1',
          cancelled: true,
          attendanceStatus: 'WAITING',
          issuePayment: null,
          paid: true,
          attendanceReasonCode: null,
          inCell: true,
        },
        attendanceListDesign: true,
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).not.toContain('In cell')
    })
    it('should not display location if the event type is court hearing', () => {
      const viewContext = {
        event: {
          startTime: '08:30',
          endTime: '11:45',
          eventType: 'COURT_HEARING',
          eventSource: 'SAA',
          summary: 'Doctors',
          appointmentId: '1',
          cancelled: true,
          attendanceStatus: 'WAITING',
          issuePayment: null,
          paid: true,
          attendanceReasonCode: null,
          inCell: true,
        },
        attendanceListDesign: true,
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).not.toContain('In cell')
    })
  })
})
