import * as cheerio from 'cheerio'
import { CheerioAPI } from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import fs from 'fs'
import { addDays } from 'date-fns'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'
import { AppointmentSeriesDetails } from '../../../../@types/activitiesAPI/types'
import { formatDate } from '../../../../utils/utils'
import { AppointmentFrequency } from '../../../../@types/appointments'
import { UserDetails } from '../../../../@types/manageUsersApiImport/types'

const view = fs.readFileSync('server/views/pages/appointments/appointment-series/details.njk')

const getSummaryListValueElement = ($: CheerioAPI, listIdentifier: string, heading: string) =>
  $(`[data-qa=${listIdentifier}] > .govuk-summary-list__row > .govuk-summary-list__key:contains("${heading}")`)
    .parent()
    .find('.govuk-summary-list__value')
const getAppointmentDetailsValueElement = ($: CheerioAPI, heading: string) =>
  getSummaryListValueElement($, 'appointment-series-details', heading)
const getFrequencyValueElement = ($: CheerioAPI) => getAppointmentDetailsValueElement($, 'Frequency')
const getNumberOfAppointmentsValueElement = ($: CheerioAPI) =>
  getAppointmentDetailsValueElement($, 'Number of appointments')

describe('Views - Appointments Management - Appointment Series Details', () => {
  let compiledTemplate: Template
  let viewContext = {
    appointmentSeries: {} as AppointmentSeriesDetails,
    userMap: {} as Map<string, UserDetails>,
  }

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = nunjucks.compile(view.toString(), njkEnv)
    const tomorrow = addDays(new Date(), 1)
    viewContext = {
      appointmentSeries: {
        startDate: formatDate(tomorrow, 'yyyy-MM-dd'),
        createdTime: formatDate(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
      } as AppointmentSeriesDetails,
      userMap: new Map([['joebloggs', { name: 'Joe Bloggs' }]]) as unknown as Map<string, UserDetails>,
    }
  })

  it('should not display schedule frequency or number of appointments when schedule = null', () => {
    viewContext.appointmentSeries.schedule = null

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect(getFrequencyValueElement($).length).toBe(0)
    expect(getNumberOfAppointmentsValueElement($).length).toBe(0)
    expect($('[data-qa=appointment-series-details]').length).toBe(0)
  })

  it.each([
    { frequency: AppointmentFrequency.WEEKDAY, expectedText: 'Every weekday (Monday to Friday)' },
    { frequency: AppointmentFrequency.DAILY, expectedText: 'Daily (includes weekends)' },
    { frequency: AppointmentFrequency.WEEKLY, expectedText: 'Weekly' },
    { frequency: AppointmentFrequency.FORTNIGHTLY, expectedText: 'Fortnightly' },
    { frequency: AppointmentFrequency.MONTHLY, expectedText: 'Monthly' },
  ])(
    'should display frequency $frequency as $expectedText when schedule is not null',
    ({ frequency, expectedText }) => {
      viewContext.appointmentSeries.schedule = {
        frequency,
        numberOfAppointments: 6,
      }

      const $ = cheerio.load(compiledTemplate.render(viewContext))

      expect(getFrequencyValueElement($).text().trim()).toEqual(expectedText)
    },
  )

  it('should display number of appointments when schedule is not null', () => {
    viewContext.appointmentSeries.schedule = {
      frequency: AppointmentFrequency.WEEKLY,
      numberOfAppointments: 6,
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect(getNumberOfAppointmentsValueElement($).text().trim()).toBe('6')
  })

  it('should display appointments when schedule is not null', () => {
    viewContext.appointmentSeries.schedule = {
      frequency: AppointmentFrequency.WEEKLY,
      numberOfAppointments: 6,
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=appointment-series-details]').length).toBe(1)
  })

  it('should show updated appointments as edited', () => {
    const tomorrow = addDays(new Date(), 1)
    const nextWeek = addDays(new Date(), 8)
    viewContext.appointmentSeries.schedule = {
      frequency: AppointmentFrequency.WEEKLY,
      numberOfAppointments: 2,
    }
    viewContext.appointmentSeries.appointments = [
      {
        id: 100,
        sequenceNumber: 1,
        startDate: formatDate(tomorrow, 'yyyy-MM-dd'),
      },
      {
        id: 101,
        sequenceNumber: 2,
        startDate: formatDate(nextWeek, 'yyyy-MM-dd'),
        isEdited: true,
      },
    ] as unknown as AppointmentSeriesDetails['appointments']

    const $ = cheerio.load(compiledTemplate.render(viewContext))
    expect($('[data-qa=appointment-status-1]').text()).not.toContain('Edited')
    expect($('[data-qa=appointment-status-2]').text()).toContain('Edited')
  })
})
