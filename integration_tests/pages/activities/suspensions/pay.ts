import Page from '../../page'

export default class SuspensionPayPage extends Page {
  constructor() {
    super('suspension-pay-page')
  }

  caption = (): Cypress.Chainable => cy.get('.govuk-caption-xl')

  title = (): Cypress.Chainable => cy.get('h1')

  selectRadio = (option: string) => this.getInputByName('paid').check(option).click()

  hintText = (): Cypress.Chainable => cy.get('#paid-hint')
}
