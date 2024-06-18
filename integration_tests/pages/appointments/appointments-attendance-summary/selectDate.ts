import Page from '../../page'

export default class SelectDatePage extends Page {
  constructor() {
    super('appointment-attendance-summary-stats-select-date-page')
  }

  dateChoice = (): Cypress.Chainable => cy.get('[data-qa="dateChoiceRadios"]')

  confirmButton = (): Cypress.Chainable => cy.get('[data-qa="select-date-submit"]')

  errorSummary = (): Cypress.Chainable => cy.get('[data-qa="error-summary"]')
}
