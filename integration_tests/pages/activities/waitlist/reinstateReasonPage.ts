import Page from '../../page'

export default class ReinstateReasonPage extends Page {
  constructor() {
    super('reinstate-reason-page')
  }

  reinstateReasonTextArea = (): Cypress.Chainable => cy.get('#reinstateReason')

  submitButton = (): Cypress.Chainable => cy.get('button').contains('Submit')
}
