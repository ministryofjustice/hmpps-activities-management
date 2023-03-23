import * as cheerio from 'cheerio'
import { CheerioAPI } from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import fs from 'fs'
import { addDays } from 'date-fns'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'
import { AppointmentRepeatPeriod } from '../../../../@types/activitiesAPI/types'
import { YesNo } from '../../../../@types/activities'
import { AppointmentType, CreateAppointmentJourney } from '../../../../routes/appointments/create/journey'

const view = fs.readFileSync('server/views/pages/appointments/create/check-answers.njk')

const getAppointmentDetailsValueElement = ($: CheerioAPI, heading: string) =>
  $(`[data-qa=appointment-details] > .govuk-summary-list__row > .govuk-summary-list__key:contains("${heading}")`)
    .parent()
    .find('.govuk-summary-list__value')
const getRepeatPeriodValueElement = ($: CheerioAPI) => getAppointmentDetailsValueElement($, 'Frequency')
const getRepeatCountValueElement = ($: CheerioAPI) => getAppointmentDetailsValueElement($, 'Occurrences')

describe('Views - Create Individual Appointment - Check Answers', () => {
  let compiledTemplate: Template
  const tomorrow = addDays(new Date(), 1)
  let viewContext = {
    session: {
      createAppointmentJourney: { type: AppointmentType.INDIVIDUAL } as CreateAppointmentJourney,
    },
    startDate: tomorrow,
    startTime: tomorrow.setHours(9, 30),
    endTime: tomorrow.setHours(10, 0),
  }

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = nunjucks.compile(view.toString(), njkEnv)
    viewContext = {
      session: {
        createAppointmentJourney: { type: AppointmentType.INDIVIDUAL } as CreateAppointmentJourney,
      },
      startDate: tomorrow,
      startTime: tomorrow.setHours(9, 30),
      endTime: tomorrow.setHours(10, 0),
    }
  })

  it('should not display repeat frequency or occurrences when repeat = NO', () => {
    viewContext.session.createAppointmentJourney.repeat = YesNo.NO

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect(getRepeatPeriodValueElement($).length).toBe(0)
    expect(getRepeatCountValueElement($).length).toBe(0)
  })

  it.each([
    { repeatPeriod: AppointmentRepeatPeriod.WEEKDAY, expectedText: 'Every weekday (Monday to Friday)' },
    { repeatPeriod: AppointmentRepeatPeriod.DAILY, expectedText: 'Daily (includes weekends)' },
    { repeatPeriod: AppointmentRepeatPeriod.WEEKLY, expectedText: 'Weekly' },
    { repeatPeriod: AppointmentRepeatPeriod.FORTNIGHTLY, expectedText: 'Fortnightly' },
    { repeatPeriod: AppointmentRepeatPeriod.MONTHLY, expectedText: 'Monthly' },
  ])('should display frequency $repeatPeriod as $expectedText when repeat = YES', ({ repeatPeriod, expectedText }) => {
    viewContext.session.createAppointmentJourney.repeat = YesNo.YES
    viewContext.session.createAppointmentJourney.repeatPeriod = repeatPeriod

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect(getRepeatPeriodValueElement($).text().trim()).toEqual(expectedText)
  })

  it('should display repeat occurrences when repeat = YES', () => {
    viewContext.session.createAppointmentJourney.repeat = YesNo.YES
    viewContext.session.createAppointmentJourney.repeatCount = 6

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect(getRepeatCountValueElement($).text().trim()).toEqual('6')
  })
})
