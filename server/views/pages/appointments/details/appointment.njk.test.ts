import * as cheerio from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import fs from 'fs'
import { addDays } from 'date-fns'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'
import { AppointmentDetails, AppointmentRepeatPeriod } from '../../../../@types/activitiesAPI/types'
import { formatDate } from '../../../../utils/utils'

const view = fs.readFileSync('server/views/pages/appointments/details/appointment.njk')

describe('Views - Create Individual Appointment - Check Answers', () => {
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

    expect($('[data-qa=repeat-period]').length).toBe(0)
    expect($('[data-qa=repeat-count]').length).toBe(0)
    expect($('[data-qa=occurrences-heading]').length).toBe(0)
    expect($('[data-qa=occurrences-summary-list]').length).toBe(0)
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

      expect($('[data-qa=repeat-period]').text().trim()).toEqual(expectedText)
    },
  )

  it('should display repeat occurrences when repeat is not null', () => {
    viewContext.appointment.repeat = {
      period: AppointmentRepeatPeriod.WEEKLY,
      count: 6,
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=repeat-count]').text().trim()).toBe('6')
  })

  it('should display occurrences when repeat is not null', () => {
    viewContext.appointment.repeat = {
      period: AppointmentRepeatPeriod.WEEKLY,
      count: 6,
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=occurrences-heading]').length).toBe(1)
    expect($('[data-qa=occurrences-summary-list]').length).toBe(1)
  })
})
