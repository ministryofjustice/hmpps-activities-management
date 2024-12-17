import Page from '../../page'

export default class ConfirmationPage extends Page {
  constructor() {
    super('confirmation-page')
  }

  title = (): Cypress.Chainable => cy.get('h1')

  subtitle = (): Cypress.Chainable => cy.get('.govuk-panel__body')
}
