import Page from '../../page'
import { formatDate } from '../../../../server/utils/utils'

export default class IndividualMovementSlip extends Page {
  constructor() {
    super('individual-movement-slip-page')
  }

  assertPrisonerSummary = (name: string, number: string, cellLocation: string) => {
    cy.get('[data-qa=name]').contains(name)
    cy.get('[data-qa=prison-number]').contains(number)
    cy.get('[data-qa=cell-location]').contains(cellLocation)
  }

  assertCategory = (category: string) => cy.get('[data-qa=reason]').contains(category)

  assertLocation = (location: string) => cy.get('[data-qa=moving-to]').contains(location)

  assertStartDate = (startDate: Date) =>
    cy.get('[data-qa=date-and-time]').contains(formatDate(startDate, 'EEEE d MMMM yyyy'))

  assertStartTime = (hour: number, minute: number) =>
    cy.get('[data-qa=date-and-time]').contains(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)

  assertEndTime = (hour: number, minute: number) =>
    cy.get('[data-qa=date-and-time]').contains(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)

  assertCreatedBy = (createdBy: string) => cy.get('[data-qa=created-by]').contains(createdBy)
}
