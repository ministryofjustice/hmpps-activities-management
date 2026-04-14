import Page from '../page'

export default class ExclusionsPage extends Page {
  constructor() {
    super('exclusions-page')
  }

  pageTitle = (): Cypress.Chainable => cy.get('h1.govuk-heading-l')

  detailsSummary = (): Cypress.Chainable => cy.get('details summary')
}
