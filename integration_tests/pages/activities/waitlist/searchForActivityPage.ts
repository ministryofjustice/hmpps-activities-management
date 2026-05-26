import Page from '../../page'

export default class WaitlistSearchForActivityPage extends Page {
  constructor() {
    super('activity-page')
  }

  searchBox = (): Cypress.Chainable => cy.get('#activityId')

  resultsList = (): Cypress.Chainable => cy.get('#activityId__listbox')
}
