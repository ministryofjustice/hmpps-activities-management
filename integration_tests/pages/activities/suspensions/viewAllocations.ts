import Page from '../../page'

export default class ViewAllocationsPage extends Page {
  constructor() {
    super('view-allocations-page')
  }

  caption = (): Cypress.Chainable => cy.get('.govuk-caption-xl')

  title = (): Cypress.Chainable => cy.get('.govuk-heading-l')

  noActiveAllocationsPara = (): Cypress.Chainable => cy.get('[data-qa=no-active-allocations]')

  activeAllocationsTable = (): Cypress.Chainable => cy.get('[data-qa=active-allocations]')

  suspendLink = (allocationId: number): Cypress.Chainable => cy.get(`[data-qa=suspend-${allocationId}]`)

  suspendedAllocationsTable = (): Cypress.Chainable => cy.get('[data-qa=suspended-allocations]')

  suspendedTableH2 = (): Cypress.Chainable => cy.get('h2')

  endSuspensionLink = (allocationId: number): Cypress.Chainable => cy.get(`[data-qa=end-suspension-${allocationId}]`)

  endAllButton = (): Cypress.Chainable => cy.get('a').contains('End all suspensions')

  suspendAllButton = (): Cypress.Chainable => cy.get('a').contains('Suspend from all activities')
}
