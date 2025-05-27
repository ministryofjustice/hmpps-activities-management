import { format } from 'date-fns'
import Page from '../../../page'

export default class VideoLinkProbationCheckAnswersPage extends Page {
  constructor() {
    super('appointment-check-answers-page')
  }

  assertAppointmentDetail = (header: string, value: string) =>
    this.assertSummaryListValue('appointment-details', header, value)

  assertScheduleDetail = (header: string, value: string) =>
    this.assertSummaryListValue('scheduling-information', header, value)

  assertPrisonerInList = (name: string, number: string) => {
    cy.get('[data-qa=prisoner-name]')
      .contains(name)
      .parent()
      .parent()
      .find('[data-qa=prisoner-number]')
      .contains(number)
  }

  assertCategory = (category: string) => this.assertAppointmentDetail('Appointment name', category)

  assertProbationTeam = (teamDescription: string) => this.assertAppointmentDetail('Probation team', teamDescription)

  assertMeetingType = (meetingType: string) => this.assertAppointmentDetail('Meeting type', meetingType)

  assertLocation = (location: string) => this.assertScheduleDetail('Location', location)

  assertStartDate = (startDate: Date) => this.assertScheduleDetail('Date', format(startDate, 'EEEE, d MMMM yyyy'))

  assertStartTime = (hour: number, minute: number) =>
    this.assertScheduleDetail('Start time', `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)

  assertEndTime = (hour: number, minute: number) =>
    this.assertScheduleDetail('End time', `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)

  createAppointment = () => cy.get('button').contains('Confirm').click()

  assertExtraInformationDetail = (header: string, value: string) =>
    this.assertSummaryListValue('extra-information', header, value)

  assertNotesForStaff = (staffNotes: string) => this.assertExtraInformationDetail('Notes for prison staff', staffNotes)

  assertNotesForPrisoners = (prisonersNotes: string) =>
    this.assertExtraInformationDetail('Notes for prisoner', prisonersNotes)
}
