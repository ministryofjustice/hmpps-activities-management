import Page from './page'

export default class IndexPage extends Page {
  constructor() {
    super('index-page')
  }

  allocateToActivityCard = (): Cypress.Chainable => cy.get('[data-qa=allocate-to-activities-card]')

  recordAttendanceCard = (): Cypress.Chainable => cy.get('[data-qa=record-attendance-card]')
}
