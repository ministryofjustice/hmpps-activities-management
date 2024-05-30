import * as cheerio from 'cheerio'
import { CheerioAPI } from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import fs from 'fs'
import { addDays } from 'date-fns'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'
import { AppointmentDetails } from '../../../../@types/activitiesAPI/types'
import { formatDate } from '../../../../utils/utils'
import { AppointmentType } from '../../../../routes/appointments/create-and-edit/appointmentJourney'
import { UserDetails } from '../../../../@types/manageUsersApiImport/types'

const view = fs.readFileSync('server/views/pages/appointments/appointment/details.njk')

let $: CheerioAPI
const getAppointmentDetailsValueElement = (heading: string) =>
  $(`[data-qa=appointment-details] > .govuk-summary-list__row > .govuk-summary-list__key:contains("${heading}")`)
    .parent()
    .find('.govuk-summary-list__value')

describe('Views - Appointments Management - Appointment Details', () => {
  let compiledTemplate: Template
  const tomorrow = addDays(new Date(), 1)
  let viewContext: { appointment: AppointmentDetails; userMap: Map<string, UserDetails> } = {
    appointment: {} as AppointmentDetails,
    userMap: {} as Map<string, UserDetails>,
  }

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = nunjucks.compile(view.toString(), njkEnv)
    viewContext = {
      appointment: {
        id: 10,
        appointmentSeries: { id: 5 },
        appointmentType: AppointmentType.GROUP,
        attendees: [
          {
            prisoner: {
              firstName: 'TEST',
              lastName: 'PRISONER',
              prisonerNumber: 'A1234BC',
              prisonCode: 'MDI',
              cellLocation: '1-2-3',
            },
          },
        ],
        startDate: formatDate(tomorrow, 'yyyy-MM-dd'),
        startTime: '23:59',
        isCancelled: false,
        isExpired: false,
        createdTime: formatDate(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
      } as AppointmentDetails,
      userMap: new Map([['joebloggs', { name: 'Joe Bloggs' }]]) as unknown as Map<string, UserDetails>,
    }
  })

  it('should display name in heading', () => {
    viewContext.appointment.appointmentName = 'Test Category'

    $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=heading]').text().trim()).toBe('Test Category')
  })

  it('should display date in sub heading', () => {
    $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=date-caption]').text().trim()).toBe(formatDate(tomorrow, 'EEEE, d MMMM yyyy'))
  })

  it('print movement slip link should open in new tab', () => {
    $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=print-movement-slips]').attr('target')).toBe('_blank')
  })

  it('should show updated by if appointment has been updated', () => {
    viewContext.appointment.updatedTime = formatDate(new Date(), "yyyy-MM-dd'T'HH:mm:ss")
    viewContext.appointment.updatedBy = 'joebloggs'

    $ = cheerio.load(compiledTemplate.render(viewContext))
    expect(
      $('[data-qa=appointment-history] .govuk-summary-list__key:contains("Last edited by")').next().text().trim(),
    ).toBe('J. Bloggs')
  })

  it('should display location as in cell', () => {
    viewContext.appointment.inCell = true

    $ = cheerio.load(compiledTemplate.render(viewContext))

    expect(getAppointmentDetailsValueElement('Location').text().trim()).toBe('In cell')
  })

  it('should display location as internal location', () => {
    viewContext.appointment.internalLocation = { id: 0, prisonCode: 'RSI', description: 'Wing A' }

    $ = cheerio.load(compiledTemplate.render(viewContext))

    expect(getAppointmentDetailsValueElement('Location').text().trim()).toBe('Wing A')
  })

  it('should show number of attendees for group appointments', () => {
    viewContext = {
      appointment: {
        id: 10,
        appointmentSeries: { id: 5 },
        appointmentType: AppointmentType.GROUP,
        attendees: [
          {
            prisoner: {
              firstName: 'TEST 1',
              lastName: 'PRISONER 1',
              prisonerNumber: 'A1234BC',
              prisonCode: 'MDI',
              cellLocation: '1-2-3',
            },
          },
          {
            prisoner: {
              firstName: 'TEST 2',
              lastName: 'PRISONER 2',
              prisonerNumber: 'A1234BD',
              prisonCode: 'MDI',
              cellLocation: '1-2-3',
            },
          },
        ],
        startDate: formatDate(tomorrow, 'yyyy-MM-dd'),
        startTime: '23:59',
        isCancelled: false,
        isExpired: false,
        createdTime: formatDate(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
      } as AppointmentDetails,
      userMap: new Map([['joebloggs', { name: 'Joe Bloggs' }]]) as unknown as Map<string, UserDetails>,
    }

    $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=prisoner-list-title]').text().trim()).toContain('2 attendees')
  })

  // FIXME uncancel test
})
