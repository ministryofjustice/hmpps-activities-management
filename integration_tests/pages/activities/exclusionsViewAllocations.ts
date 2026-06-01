import Page from '../page'

export default class ExclusionsViewAllocations extends Page {
  constructor() {
    super('view-allocations-page')
  }

  viewSuspendedLinks = (): Cypress.Chainable => cy.get('[data-qa=suspension-link]')

  suspensionBadge = (): Cypress.Chainable => cy.get('[data-qa=suspension-badge]')

  changeLink = (index: number): Cypress.Chainable => cy.get('a').filter(':contains("Change")').eq(index)

  firstSuspensionLink = (): Cypress.Chainable => cy.contains('View suspension').click()
}
