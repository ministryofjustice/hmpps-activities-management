import Page from '../page'

export default class exclusionsViewAllocations extends Page {
  constructor() {
    super('view-allocations-page')
  }

  viewSuspendedLinks = (): Cypress.Chainable => cy.get('[data-qa=suspension-link]')

  firstSuspensionLink = (): Cypress.Chainable => cy.contains('View suspension').click()
}
