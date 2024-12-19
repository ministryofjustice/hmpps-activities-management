import Page from '../../page'

export default class CheckAnswersPage extends Page {
  constructor() {
    super('check-answers-page')
  }

  summary = (): Cypress.Chainable => cy.get('[data-qa="suspension-summary"]')
}
