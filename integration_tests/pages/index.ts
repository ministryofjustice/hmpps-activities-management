import Page from './page'

export default class IndexPage extends Page {
  constructor() {
    super('index-page')
  }

  createActivityCard = (): Cypress.Chainable => cy.get('[data-qa=create-an-activity-card]')

  manageActivitiesAndAllocationsCard = (): Cypress.Chainable => cy.get('[data-qa=manage-activities-and-allocations')

  markAndManageAttendanceCard = (): Cypress.Chainable => cy.get('[data-qa=mark-and-manage-attendance]')

  appointmentsManagementCard = (): Cypress.Chainable => cy.get('[data-qa=create-and-manage-appointments]')
}
