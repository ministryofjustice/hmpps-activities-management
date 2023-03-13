import Page from '../../page'
import { formatDate } from '../../../../server/utils/utils'

export default class CheckAnswersPage extends Page {
  constructor() {
    super('appointments-create-single-check-answers-page')
  }

  assertPrisonerSummary = (name: string, number: string, cellLocation: string) => {
    cy.get('[data-qa=prisoner-name]').contains(name)
    cy.get('[data-qa=prisoner-number]').contains(number)
    cy.get('[data-qa=prisoner-cell-location]').contains(cellLocation)
  }

  assertCategory = (category: string) => cy.get('[data-qa=category]').contains(category)

  assertLocation = (location: string) => cy.get('[data-qa=location]').contains(location)

  assertStartDate = (startDate: Date) =>
    cy.get('[data-qa=start-date]').contains(formatDate(startDate, 'EEEE d MMMM yyyy'))

  assertStartTime = (hour: number, minute: number) =>
    cy.get('[data-qa=start-time]').contains(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)

  assertEndTime = (hour: number, minute: number) =>
    cy.get('[data-qa=end-time]').contains(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)

  assertRepeat = (option: string) => cy.get('[data-qa=repeat]').contains(option)

  assertRepeatPeriod = (option: string) => cy.get('[data-qa=repeat-period]').contains(option)

  assertRepeatCount = (option: string) => cy.get('[data-qa=repeat-count]').contains(option)

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
