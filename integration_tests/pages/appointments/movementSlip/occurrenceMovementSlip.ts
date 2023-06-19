import Page from '../../page'
import { formatDate } from '../../../../server/utils/utils'

export default class OccurrenceMovementSlip extends Page {
  constructor() {
    super('occurrence-movement-slip-page')
  }

  assertPrisonerSummary = (name: string, number: string, cellLocation: string) => {
    cy.get('[data-qa=prisoner-name-and-number]').contains(name)
    cy.get('[data-qa=prisoner-name-and-number]').contains(number)
    cy.get('[data-qa=cell-location]').contains(cellLocation)
  }

  assertCategory = (category: string) => cy.get('[data-qa=appointment]').contains(category)

  assertLocation = (location: string) => cy.get('[data-qa=location]').contains(location)

  assertStartDate = (startDate: Date) => cy.get('[data-qa=time]').contains(formatDate(startDate, 'EEEE, d MMMM yyyy'))

  assertStartTime = (hour: number, minute: number) =>
    cy.get('[data-qa=time]').contains(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)

  assertEndTime = (hour: number, minute: number) =>
    cy.get('[data-qa=time]').contains(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)

  assertComments = (comments: string) => cy.get('[data-qa=extra-information]').contains(comments)
}
