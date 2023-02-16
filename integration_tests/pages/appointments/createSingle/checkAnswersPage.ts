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

  createAppointment = () => cy.get('button').contains('Accept and save').click()
}
