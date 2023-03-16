import Page from '../../page'
import { formatDate } from '../../../../server/utils/utils'

export default class CheckAnswersPage extends Page {
  constructor() {
    super('appointments-create-single-check-answers-page')
  }

  assertAppointmentDetail = (header: string, value: string) =>
    this.assertSummaryListValue('appointment-details', header, value)

  assertPrisonerSummary = (name: string, number: string, cellLocation: string) => {
    cy.get('[data-qa=prisoner-name]').contains(name)
    cy.get('[data-qa=prisoner-number]').contains(number)
    cy.get('[data-qa=prisoner-cell-location]').contains(cellLocation)
  }

  assertCategory = (category: string) => this.assertAppointmentDetail('Category', category)

  assertLocation = (location: string) => this.assertAppointmentDetail('Location', location)

  assertStartDate = (startDate: Date) => this.assertAppointmentDetail('Date', formatDate(startDate, 'EEEE d MMMM yyyy'))

  assertStartTime = (hour: number, minute: number) =>
    this.assertAppointmentDetail('Start time', `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)

  assertEndTime = (hour: number, minute: number) =>
    this.assertAppointmentDetail('End time', `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)

  assertRepeat = (option: string) => this.assertAppointmentDetail('Repeat', option)

  assertRepeatPeriod = (option: string) => this.assertAppointmentDetail('Frequency', option)

  assertRepeatCount = (option: string) => this.assertAppointmentDetail('Occurrences', option)

  changePrisoner = () => cy.get('[data-qa=change-prisoner]').click()

  changeCategory = () => cy.get('[data-qa=change-category]').click()

  changeLocation = () => cy.get('[data-qa=change-location]').click()

  changeStartDate = () => cy.get('[data-qa=change-start-date]').click()

  changeStartTime = () => cy.get('[data-qa=change-start-time]').click()

  changeEndTime = () => cy.get('[data-qa=change-end-time]').click()

  changeRepeat = () => cy.get('[data-qa=change-repeat]').click()

  changeRepeatPeriod = () => cy.get('[data-qa=change-repeat-period]').click()

  changeRepeatCount = () => cy.get('[data-qa=change-repeat-count]').click()

  createAppointment = () => cy.get('button').contains('Accept and save').click()
}
