import Page from '../../page'

export default class NoAttendeesPage extends Page {
  constructor() {
    super('appointments-no-attendees-page')
  }

  summaryText = (text: string): Cypress.Chainable => cy.get('p').contains(text)

  addSomeoneToTheListButton = (): Cypress.Chainable => cy.get('button').contains('Add someone to the list')
}
