import Page from '../../page'

export default class RequesterPage extends Page {
  constructor() {
    super('requester')
  }

  prisonerRadioClick = (): Cypress.Chainable => cy.get('#requester').click()

  guidanceStaffRadioClick = (): Cypress.Chainable => cy.get('#requester-2').click()

  someoneElseRadioClick = (): Cypress.Chainable => cy.get('#requester-3').click()

  someoneElseSelect = (): Cypress.Chainable => cy.get('#otherRequester')
}
