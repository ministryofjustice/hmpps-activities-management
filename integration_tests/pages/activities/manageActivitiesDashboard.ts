import Page from '../page'

export default class AllocateIndexPage extends Page {
  constructor() {
    super('allocate-home')
  }

  allocateToActivityCard = (): Cypress.Chainable => cy.get('[data-qa=manage-allocations]')

  changesInCircumstancesCard = (): Cypress.Chainable => cy.get('[data-qa=change-of-circumstances]')

  cardActivityCard = (): Cypress.Chainable => cy.get('[data-qa=create-an-activity]')
}
