import { format } from 'date-fns'
import Page from '../../../page'

export default class VideoLinkCourtCheckAnswersPage extends Page {
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

  assertExtraInformationDetail = (header: string, value: string) =>
    this.assertSummaryListValue('extra-information', header, value)

  assertCategory = (category: string) => this.assertAppointmentDetail('Appointment name', category)

  assertCourt = (courtDescription: string) => this.assertAppointmentDetail('Court', courtDescription)

  assertHearingType = (hearingType: string) => this.assertAppointmentDetail('Hearing type', hearingType)

  assertHearingLink = (hearingLink: string) => this.assertAppointmentDetail('Court hearing link', hearingLink)

  assertGuestPin = (pin: string) => this.assertAppointmentDetail('Guest pin', pin)

  assertMainLocation = (location: string) => this.assertMainScheduleDetail('Location', location)

  assertNotesForStaff = (staffNotes: string) => this.assertExtraInformationDetail('Notes for prison staff', staffNotes)

  assertNotesForPrisoners = (prisonersNotes: string) =>
    this.assertExtraInformationDetail('Notes for prisoner', prisonersNotes)

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
