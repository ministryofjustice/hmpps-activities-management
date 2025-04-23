import Page from '../../page'

export default class StatusPage extends Page {
  constructor() {
    super('status-page')
  }

  approvedRadioClick = (): Cypress.Chainable => cy.get('#status').click()

  rejectedRadioClick = (): Cypress.Chainable => cy.get('#status-2').click()

  pendingRadioClick = (): Cypress.Chainable => cy.get('#status-4').click()

  commentTextArea = (): Cypress.Chainable => cy.get('#comment')
}
