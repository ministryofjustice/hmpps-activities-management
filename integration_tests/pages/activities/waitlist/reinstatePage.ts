import Page from '../../page'

export default class ReinstatePage extends Page {
  constructor() {
    super('reinstate-page')
  }

  yesRadioClick = (): Cypress.Chainable => cy.get('#reinstate').click()

  noRadioClick = (): Cypress.Chainable => cy.get('#reinstate-2').click()

  continueButton = (): Cypress.Chainable => cy.get('button').contains('Continue')

  cancelLink = (): Cypress.Chainable => cy.get('a').contains('Cancel')
}
