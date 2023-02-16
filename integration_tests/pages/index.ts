import Page from './page'

export default class IndexPage extends Page {
  constructor() {
    super('index-page')
  }

  createActivityCard = (): Cypress.Chainable => cy.get('[data-qa=create-an-activity-card]')

  allocateToActivityCard = (): Cypress.Chainable => cy.get('[data-qa=allocate-to-activities-card]')

  recordAttendanceCard = (): Cypress.Chainable => cy.get('[data-qa=record-attendance-card]')

  appointmentsManagementCard = (): Cypress.Chainable => cy.get('[data-qa=appointments-management-card]')
}
