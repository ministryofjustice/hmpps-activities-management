import Page from '../page'

export default class NamePage extends Page {
  constructor() {
    super('create-schedule-name-page')
  }

  activityInfo = (): Cypress.Chainable => cy.get('[data-qa="activity-info"]')

  activitySummary = (): Cypress.Chainable => cy.get('[data-qa="activity-summary"]')

  enterName = (text: string) => this.getInputByName('name').type(text)
}
