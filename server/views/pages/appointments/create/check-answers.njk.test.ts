import * as cheerio from 'cheerio'
import { CheerioAPI } from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import fs from 'fs'
import { addDays } from 'date-fns'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'
import { AppointmentRepeatPeriod } from '../../../../@types/activitiesAPI/types'
import { YesNo } from '../../../../@types/activities'
import { AppointmentType, CreateAppointmentJourney } from '../../../../routes/appointments/create/journey'

let $: CheerioAPI
const view = fs.readFileSync('server/views/pages/appointments/create/check-answers.njk')

const getAppointmentDetailsValueElement = (heading: string) =>
  $(`[data-qa=appointment-details] > .govuk-summary-list__row > .govuk-summary-list__key:contains("${heading}")`)
    .parent()
    .find('.govuk-summary-list__value')

const getPrisonerDetailsValueElement = (heading: string) =>
  $(`[data-qa=prisoner-details] > .govuk-summary-list__row > .govuk-summary-list__key:contains("${heading}")`)
    .parent()
    .find('.govuk-summary-list__value')

const getRepeatPeriodValueElement = () => getAppointmentDetailsValueElement('Frequency')
const getRepeatCountValueElement = () => getAppointmentDetailsValueElement('Occurrences')
const getIndividualPrisonerValueElement = (qaAttr: string) =>
  getAppointmentDetailsValueElement('Prisoner').find(`[data-qa="${qaAttr}"]`)
const getPrisonerListValueElement = (qaAttr: string, index: number) =>
  $(getPrisonerDetailsValueElement('Prisoner').find(`[data-qa="${qaAttr}"]`).get(index))

describe('Views - Create Appointment - Check Answers', () => {
  let compiledTemplate: Template
  const tomorrow = addDays(new Date(), 1)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let viewContext: any = {}

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = nunjucks.compile(view.toString(), njkEnv)
    viewContext = {
      session: {
        createAppointmentJourney: {
          type: AppointmentType.INDIVIDUAL,
          prisoners: [
            {
              name: 'Lee Jacobson',
              number: 'A1351DZ',
              cellLocation: '1-3-004',
            },
          ],
        } as CreateAppointmentJourney,
      },
      startDate: tomorrow,
      startTime: tomorrow.setHours(9, 30),
      endTime: tomorrow.setHours(10, 0),
    }

    $ = cheerio.load(compiledTemplate.render(viewContext))
  })

  it('should not display repeat frequency or occurrences when repeat = NO', () => {
    viewContext.session.createAppointmentJourney.repeat = YesNo.NO
    $ = cheerio.load(compiledTemplate.render(viewContext))

    expect(getRepeatPeriodValueElement().length).toBe(0)
    expect(getRepeatCountValueElement().length).toBe(0)
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
    $ = cheerio.load(compiledTemplate.render(viewContext))

    expect(getRepeatPeriodValueElement().text().trim()).toEqual(expectedText)
  })

  it('should display repeat occurrences when repeat = YES', () => {
    viewContext.session.createAppointmentJourney.repeat = YesNo.YES
    viewContext.session.createAppointmentJourney.repeatCount = 6
    $ = cheerio.load(compiledTemplate.render(viewContext))

    expect(getRepeatCountValueElement().text().trim()).toEqual('6')
  })

  describe('Individual Appointment', () => {
    it('should display prisoner details', () => {
      expect(getIndividualPrisonerValueElement('prisoner-name').text().trim()).toEqual('Lee Jacobson')
    })
  })

  describe('Group Appointment', () => {
    beforeEach(() => {
      viewContext.session.createAppointmentJourney.type = AppointmentType.GROUP
      viewContext.session.createAppointmentJourney.prisoners = [
        {
          name: 'Lee Jacobson',
          number: 'A1351DZ',
          cellLocation: '1-3-004',
        },
        {
          name: 'David Winchurch',
          number: 'A1350DZ',
          cellLocation: '2-2-024',
        },
      ]
      $ = cheerio.load(compiledTemplate.render(viewContext))
    })

    it('should display prisoners details', () => {
      expect(getPrisonerListValueElement('prisoner-name', 0).text().trim()).toEqual('Jacobson, Lee')
      expect(getPrisonerListValueElement('prisoner-name', 1).text().trim()).toEqual('Winchurch, David')
    })
  })
})
