import * as cheerio from 'cheerio'
import { CheerioAPI } from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import fs from 'fs'
import { addDays } from 'date-fns'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'
import { YesNo } from '../../../../@types/activities'
import {
  AppointmentJourney,
  AppointmentJourneyMode,
  AppointmentType,
} from '../../../../routes/appointments/create-and-edit/appointmentJourney'
import { AppointmentFrequency } from '../../../../@types/appointments'
import { formatIsoDate } from '../../../../utils/datePickerUtils'
import EventTier, { eventTierDescriptions } from '../../../../enum/eventTiers'
import EventOrganiser, { organiserDescriptions } from '../../../../enum/eventOrganisers'

let $: CheerioAPI
const view = fs.readFileSync('server/views/pages/appointments/create-and-edit/check-answers.njk')

const getAppointmentDetailsValueElement = (heading: string) =>
  $(`[data-qa=appointment-details] > .govuk-summary-list__row > .govuk-summary-list__key:contains("${heading}")`)
    .parent()
    .find('.govuk-summary-list__value')

const getSchedulingInformationValueElement = (heading: string) =>
  $(`[data-qa=scheduling-information] > .govuk-summary-list__row > .govuk-summary-list__key:contains("${heading}")`)
    .parent()
    .find('.govuk-summary-list__value')

const getPrisonerDetailsValueElement = (heading: string) =>
  $(`[data-qa=prisoner-details] > .govuk-summary-list__row > .govuk-summary-list__key:contains("${heading}")`)
    .parent()
    .find('.govuk-summary-list__value')

const getFrequencyValueElement = () => getSchedulingInformationValueElement('Frequency')
const getNumberOfAppointmentsValueElement = () => getSchedulingInformationValueElement('Number of appointments')
const getPrisonerListValueElement = (qaAttr: string, index: number) =>
  $(getPrisonerDetailsValueElement('Name of attendee').find(`[data-qa="${qaAttr}"]`).get(index))

describe('Views - Create Appointment - Check Answers', () => {
  let compiledTemplate: Template
  const tomorrow = addDays(new Date(), 1)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let viewContext: any = {}

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = nunjucks.compile(view.toString(), njkEnv)
    viewContext = {
      tier: eventTierDescriptions[EventTier.TIER_2],
      organiser: organiserDescriptions[EventOrganiser.EXTERNAL_PROVIDER],
      session: {
        appointmentJourney: {
          mode: AppointmentJourneyMode.CREATE,
          type: AppointmentType.GROUP,
          prisoners: [
            {
              name: 'Lee Jacobson',
              number: 'A1351DZ',
              cellLocation: '1-3-004',
            },
          ],
          startDate: formatIsoDate(tomorrow),
          startTime: {
            hour: 9,
            minute: 30,
          },
          endTime: {
            hour: 10,
            minute: 0,
          },
          tierCode: EventTier.TIER_2,
          organiserCode: EventOrganiser.EXTERNAL_PROVIDER,
        } as AppointmentJourney,
      },
    }

    $ = cheerio.load(compiledTemplate.render(viewContext))
  })

  it('should display appointment name', () => {
    viewContext.session.appointmentJourney.appointmentName = 'Bible studies (Chaplaincy)'

    $ = cheerio.load(compiledTemplate.render(viewContext))

    expect(getAppointmentDetailsValueElement('Appointment name').text().trim()).toBe('Bible studies (Chaplaincy)')
  })

  it('should display appointment tier & organiser information', () => {
    $ = cheerio.load(compiledTemplate.render(viewContext))

    expect(getAppointmentDetailsValueElement('Tier').text().trim()).toBe('Tier 2')
    expect(getAppointmentDetailsValueElement('Host').text().trim()).toBe('An external provider')
  })

  it('should not display repeat frequency or number of appointments when repeat = NO', () => {
    viewContext.session.appointmentJourney.repeat = YesNo.NO
    $ = cheerio.load(compiledTemplate.render(viewContext))

    expect(getFrequencyValueElement().length).toBe(0)
    expect(getNumberOfAppointmentsValueElement().length).toBe(0)
  })

  it.each([
    { frequency: AppointmentFrequency.WEEKDAY, expectedText: 'Every weekday (Monday to Friday)' },
    { frequency: AppointmentFrequency.DAILY, expectedText: 'Daily (includes weekends)' },
    { frequency: AppointmentFrequency.WEEKLY, expectedText: 'Weekly' },
    { frequency: AppointmentFrequency.FORTNIGHTLY, expectedText: 'Fortnightly' },
    { frequency: AppointmentFrequency.MONTHLY, expectedText: 'Monthly' },
  ])('should display frequency $frequency as $expectedText when repeat = YES', ({ frequency, expectedText }) => {
    viewContext.session.appointmentJourney.repeat = YesNo.YES
    viewContext.session.appointmentJourney.frequency = frequency
    $ = cheerio.load(compiledTemplate.render(viewContext))

    expect(getFrequencyValueElement().text().trim()).toEqual(expectedText)
  })

  it('should display repeat number of appointments when repeat = YES', () => {
    viewContext.session.appointmentJourney.repeat = YesNo.YES
    viewContext.session.appointmentJourney.numberOfAppointments = 6
    $ = cheerio.load(compiledTemplate.render(viewContext))

    expect(getNumberOfAppointmentsValueElement().text().trim()).toEqual('6')
  })

  describe('Group Appointment', () => {
    beforeEach(() => {
      viewContext.session.appointmentJourney.type = AppointmentType.GROUP
      viewContext.session.appointmentJourney.prisoners = [
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
