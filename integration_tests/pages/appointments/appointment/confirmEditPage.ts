import Page from '../../page'

export default class ConfirmEditPage extends Page {
  constructor() {
    super('appointment-confirm-edit-page')
  }

  caption = (): Cypress.Chainable => cy.get('[data-qa=caption]')

  yesRadioClick = (): Cypress.Chainable => cy.get('#confirm').click()

  noRadioClick = (): Cypress.Chainable => cy.get('#confirm-2').click()
}
