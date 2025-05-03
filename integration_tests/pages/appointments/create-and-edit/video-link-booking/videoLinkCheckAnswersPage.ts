import { format } from 'date-fns'
import Page from '../../../page'

export default class VideoLinkCheckAnswersPage extends Page {
  constructor() {
    super('appointment-check-answers-page')
  }

  assertAppointmentDetail = (header: string, value: string) =>
    this.assertSummaryListValue('appointment-details', header, value)

  assertMainScheduleDetail = (header: string, value: string) =>
    this.assertSummaryListValue('main-scheduling-information', header, value)

  assertSummaryListByValueOnly = (listIdentifier: string, expectedValue: string) =>
    cy
      .get(`[data-qa=${listIdentifier}] > .govuk-summary-list__row > .govuk-summary-list__value`)
      .should('contain.text', expectedValue)

  assertPreScheduleDetail = (value: string) => this.assertSummaryListByValueOnly('pre-scheduling-information', value)

  assertPostScheduleDetail = (value: string) => this.assertSummaryListByValueOnly('post-scheduling-information', value)

  assertPrisonerInList = (name: string, number: string) => {
    cy.get('[data-qa=prisoner-name]')
      .contains(name)
      .parent()
      .parent()
      .find('[data-qa=prisoner-number]')
      .contains(number)
  }

  assertCategory = (category: string) => this.assertAppointmentDetail('Appointment name', category)

  assertCourt = (courtDescription: string) => this.assertAppointmentDetail('Court', courtDescription)

  assertHearingType = (hearingType: string) => this.assertAppointmentDetail('Hearing type', hearingType)

  assertHearingLink = (hearingLink: string) => this.assertAppointmentDetail('Court hearing link', hearingLink)

  assertMainLocation = (location: string) => this.assertMainScheduleDetail('Location', location)

  assertMainStartDate = (startDate: Date) =>
    this.assertMainScheduleDetail('Date', format(startDate, 'EEEE, d MMMM yyyy'))

  assertMainStartTime = (hour: number, minute: number) =>
    this.assertMainScheduleDetail('Start time', `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)

  assertMainEndTime = (hour: number, minute: number) =>
    this.assertMainScheduleDetail('End time', `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)

  assertPreHearingNone = () => this.assertPreScheduleDetail('No pre-court hearing')

  assertPostHearingNone = () => this.assertPostScheduleDetail('No post-court hearing')

  createAppointment = () => cy.get('button').contains('Confirm').click()
}
