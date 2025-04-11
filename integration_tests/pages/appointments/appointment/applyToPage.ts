import Page from '../../page'

export default class ApplyToPage extends Page {
  constructor() {
    super('appointment-apply-to-page')
  }

  caption = (): Cypress.Chainable => cy.get('[data-qa=caption]')

  applyToThisOneRadio = (): Cypress.Chainable => cy.get('#applyTo').click()

  applyToThisAndAfterRadio = (): Cypress.Chainable => cy.get('#applyTo-2').click()

  applyToAllRadio = (): Cypress.Chainable => cy.get('#applyTo-3').click()
}
