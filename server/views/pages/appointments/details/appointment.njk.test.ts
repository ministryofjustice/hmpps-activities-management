import * as cheerio from 'cheerio'
import { CheerioAPI } from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import fs from 'fs'
import { addDays } from 'date-fns'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'
import { AppointmentDetails } from '../../../../@types/activitiesAPI/types'
import { formatDate } from '../../../../utils/utils'
import { AppointmentType } from '../../../../routes/appointments/create-and-edit/appointmentJourney'
import { AppointmentRepeatPeriod } from '../../../../@types/appointments'

const view = fs.readFileSync('server/views/pages/appointments/details/appointment.njk')

const getSummaryListValueElement = ($: CheerioAPI, listIdentifier: string, heading: string) =>
  $(`[data-qa=${listIdentifier}] > .govuk-summary-list__row > .govuk-summary-list__key:contains("${heading}")`)
    .parent()
    .find('.govuk-summary-list__value')
const getAppointmentDetailsValueElement = ($: CheerioAPI, heading: string) =>
  getSummaryListValueElement($, 'appointment-details', heading)
const getRepeatPeriodValueElement = ($: CheerioAPI) => getAppointmentDetailsValueElement($, 'Frequency')
const getRepeatCountValueElement = ($: CheerioAPI) => getAppointmentDetailsValueElement($, 'Occurrences')

describe('Views - Appointments Management - Appointment Details', () => {
  let compiledTemplate: Template
  let viewContext = {
    appointment: {} as AppointmentDetails,
  }

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = nunjucks.compile(view.toString(), njkEnv)
    const tomorrow = addDays(new Date(), 1)
    viewContext = {
      appointment: {
        startDate: formatDate(tomorrow, 'yyyy-MM-dd'),
      } as AppointmentDetails,
    }
  })

  it('should not display repeat frequency or occurrences when repeat = null', () => {
    viewContext.appointment.repeat = null

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect(getRepeatPeriodValueElement($).length).toBe(0)
    expect(getRepeatCountValueElement($).length).toBe(0)
    expect($('[data-qa=occurrences-heading]').length).toBe(0)
    expect($('[data-qa=appointment-occurrences]').length).toBe(0)
  })

  it.each([
    { repeatPeriod: AppointmentRepeatPeriod.WEEKDAY, expectedText: 'Every weekday (Monday to Friday)' },
    { repeatPeriod: AppointmentRepeatPeriod.DAILY, expectedText: 'Daily (includes weekends)' },
    { repeatPeriod: AppointmentRepeatPeriod.WEEKLY, expectedText: 'Weekly' },
    { repeatPeriod: AppointmentRepeatPeriod.FORTNIGHTLY, expectedText: 'Fortnightly' },
    { repeatPeriod: AppointmentRepeatPeriod.MONTHLY, expectedText: 'Monthly' },
  ])(
    'should display frequency $repeatPeriod as $expectedText when repeat is not null',
    ({ repeatPeriod, expectedText }) => {
      viewContext.appointment.repeat = {
        period: repeatPeriod,
        count: 6,
      }

      const $ = cheerio.load(compiledTemplate.render(viewContext))

      expect(getRepeatPeriodValueElement($).text().trim()).toEqual(expectedText)
    },
  )

  it('should display repeat occurrences when repeat is not null', () => {
    viewContext.appointment.repeat = {
      period: AppointmentRepeatPeriod.WEEKLY,
      count: 6,
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect(getRepeatCountValueElement($).text().trim()).toBe('6')
  })

  it('should display occurrences when repeat is not null', () => {
    viewContext.appointment.repeat = {
      period: AppointmentRepeatPeriod.WEEKLY,
      count: 6,
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=occurrences-heading]').length).toBe(1)
    expect($('[data-qa=appointment-occurrences]').length).toBe(1)
  })

  it('should display prisoner list if single group appointment', () => {
    viewContext.appointment.appointmentType = AppointmentType.GROUP

    const $ = cheerio.load(compiledTemplate.render(viewContext))
    expect($('[data-qa=prisoner-list]').length).toBe(1)
    expect($('[data-qa=appointment-details] .govuk-summary-list__key:contains("Prisoners")').length).toBe(0)
  })

  it('should display prisoner count if repeat group appointment', () => {
    viewContext.appointment.appointmentType = AppointmentType.GROUP
    viewContext.appointment.repeat = {
      period: AppointmentRepeatPeriod.WEEKLY,
      count: 6,
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))
    expect($('[data-qa=appointment-details] .govuk-summary-list__key:contains("Prisoners")').length).toBe(1)
    expect($('[data-qa=prisoner-list]').length).toBe(0)
  })

  it('should not display prisoner summary if group appointment', () => {
    viewContext.appointment.appointmentType = AppointmentType.GROUP

    const $ = cheerio.load(compiledTemplate.render(viewContext))
    expect($('[data-qa=prisoner-summary]').length).toBe(0)
  })

  it('should show updated occurrences as edited', () => {
    const tomorrow = addDays(new Date(), 1)
    const nextWeek = addDays(new Date(), 8)
    viewContext.appointment.repeat = {
      period: AppointmentRepeatPeriod.WEEKLY,
      count: 2,
    }
    viewContext.appointment.occurrences = [
      {
        id: 100,
        sequenceNumber: 1,
        startDate: formatDate(tomorrow, 'yyyy-MM-dd'),
      },
      {
        id: 101,
        sequenceNumber: 2,
        startDate: formatDate(nextWeek, 'yyyy-MM-dd'),
        updated: '2023-02-20T10:00:00',
        updatedBy: {
          id: 231232,
          username: 'USER1',
          firstName: 'john',
          lastName: 'smith',
        },
      },
    ] as unknown as AppointmentDetails['occurrences']

    const $ = cheerio.load(compiledTemplate.render(viewContext))
    expect($('[data-qa=occurrence-edited-1]').text()).not.toContain('Edited')
    expect($('[data-qa=occurrence-edited-2]').text()).toContain('Edited')
  })
})
