import { format } from 'date-fns'
import Page from '../../page'

export default class CheckAnswersPage extends Page {
  constructor() {
    super('appointment-check-answers-page')
  }

  assertAppointmentDetail = (header: string, value: string) =>
    this.assertSummaryListValue('appointment-details', header, value)

  assertScheduleDetail = (header: string, value: string) =>
    this.assertSummaryListValue('scheduling-information', header, value)

  assertExtraDetail = (header: string, value: string) => this.assertSummaryListValue('extra-information', header, value)

  assertPrisonerSummary = (name: string, number: string, cellLocation: string) => {
    cy.get('[data-qa=prisoner-name]').contains(name)
    cy.get('[data-qa=prisoner-number]').contains(number)
    cy.get('[data-qa=prisoner-cell-location]').contains(cellLocation)
  }

  assertPrisonerInList = (name: string, number: string) => {
    cy.get('[data-qa=prisoner-name]')
      .contains(name)
      .parent()
      .parent()
      .find('[data-qa=prisoner-number]')
      .contains(number)
  }

  assertCategory = (category: string) => this.assertAppointmentDetail('Appointment name', category)

  assertTier = (tier: string) => this.assertAppointmentDetail('Tier', tier)

  assertHost = (host: string) => this.assertAppointmentDetail('Host', host)

  assertLocation = (location: string) => this.assertScheduleDetail('Location', location)

  assertStartDate = (startDate: Date) => this.assertScheduleDetail('Date', format(startDate, 'EEEE, d MMMM yyyy'))

  assertStartTime = (hour: number, minute: number) =>
    this.assertScheduleDetail('Start time', `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)

  assertEndTime = (hour: number, minute: number) =>
    this.assertScheduleDetail('End time', `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)

  assertRepeat = (option: string) => this.assertScheduleDetail('Repeats', option)

  assertFrequency = (option: string) => this.assertScheduleDetail('Frequency', option)

  assertNumberOfAppointments = (option: string) => this.assertScheduleDetail('Number of appointments', option)

  assertExtraInformation = (comment: string) => this.assertExtraDetail('Extra information', comment)

  changePrisoners = () => cy.get('[data-qa=change-prisoners]').click()

  changeName = () => cy.get('[data-qa=change-name]').click()

  changeTier = () => cy.get('[data-qa=change-tier]').click()

  changeHost = () => cy.get('[data-qa=change-host]').click()

  changeLocation = () => cy.get('[data-qa=change-location]').click()

  changeStartDate = () => cy.get('[data-qa=change-start-date]').click()

  changeStartTime = () => cy.get('[data-qa=change-start-time]').click()

  changeEndTime = () => cy.get('[data-qa=change-end-time]').click()

  changeRepeat = () => cy.get('[data-qa=change-repeat]').click()

  changeFrequency = () => cy.get('[data-qa=change-frequency]').click()

  changeNumberOfAppointments = () => cy.get('[data-qa=change-number-of-appointments]').click()

  changeExtraInformation = () => cy.get('[data-qa=change-extra-information]').click()

  createAppointment = () => cy.get('button').contains('Confirm').click()
}
