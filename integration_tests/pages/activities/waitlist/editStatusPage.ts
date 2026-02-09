import Page from '../../page'

export default class EditStatusPage extends Page {
  constructor() {
    super('status-page')
  }

  checkCurrentStatus = (status: string) => {
    cy.get('.govuk-inset-text').should('contain', `${status}`)
  }

  checkHintText = (expectedText: string) => {
    cy.get('p').should('contain.text', expectedText)
  }

  approvedRadioButton = (): Cypress.Chainable => cy.get('input[name="status"][value="APPROVED"]')

  rejectedRadioButton = (): Cypress.Chainable => cy.get('input[name="status"][value="DECLINED"]')

  pendingRadioButton = (): Cypress.Chainable => cy.get('input[name="status"][value="PENDING"]')

  withdrawnRadioButton = (): Cypress.Chainable => cy.get('input[name="status"][value="WITHDRAWN"]')

  updateButton = (): Cypress.Chainable => cy.get('button').contains('Update application status')
}
