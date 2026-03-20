import Page from '../../page'

export default class ReinstateReasonPage extends Page {
  constructor() {
    super('reinstate-reason-page')
  }

  reinstateReasonTextArea = (): Cypress.Chainable => cy.get('#reinstate-reason')

  confirmButton = (): Cypress.Chainable => cy.get('button').contains('Confirm')
}
