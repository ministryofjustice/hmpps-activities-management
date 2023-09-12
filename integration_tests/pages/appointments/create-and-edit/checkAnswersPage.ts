import { format } from 'date-fns'
import Page from '../../page'

export default class CheckAnswersPage extends Page {
  constructor() {
    super('appointment-check-answers-page')
  }

  assertAppointmentDetail = (header: string, value: string) =>
    this.assertSummaryListValue('appointment-details', header, value)

  assertPrisonerSummary = (name: string, number: string, cellLocation: string) => {
    cy.get('[data-qa=prisoner-name]').contains(name)
    cy.get('[data-qa=prisoner-number]').contains(number)
    cy.get('[data-qa=prisoner-cell-location]').contains(cellLocation)
  }

  assertPrisonerInList = (name: string, number: string) => {
    cy.get('[data-qa=prisoner-name]').contains(name).parent().find('[data-qa=prisoner-number]').contains(number)
  }

  assertCategory = (category: string) => this.assertAppointmentDetail('Appointment name', category)

  assertLocation = (location: string) => this.assertAppointmentDetail('Location', location)

  assertStartDate = (startDate: Date) => this.assertAppointmentDetail('Date', format(startDate, 'EEEE, d MMMM yyyy'))

  assertStartTime = (hour: number, minute: number) =>
    this.assertAppointmentDetail('Start time', `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)

  assertEndTime = (hour: number, minute: number) =>
    this.assertAppointmentDetail('End time', `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)

  assertRepeat = (option: string) => this.assertAppointmentDetail('Repeats', option)

  assertFrequency = (option: string) => this.assertAppointmentDetail('Frequency', option)

  assertNumberOfAppointments = (option: string) => this.assertAppointmentDetail('Number of appointments', option)

  assertExtraInformation = (comment: string) => this.assertAppointmentDetail('Extra information', comment)

  changePrisoner = () => cy.get('[data-qa=change-prisoner]').click()

  changeName = () => cy.get('[data-qa=change-name]').click()

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
