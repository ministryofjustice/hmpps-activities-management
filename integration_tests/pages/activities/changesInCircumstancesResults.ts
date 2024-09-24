import Page from '../page'

export default class ChangesInCircumstancesResultsPage extends Page {
  constructor() {
    super('change-of-circumstance-page')
  }

  noDataParagraph = (): Cypress.Chainable => cy.get('[data-qa="no-data-p"]')

  noDataLink = (): Cypress.Chainable => cy.get('[data-qa="no-data-link"]')
}
