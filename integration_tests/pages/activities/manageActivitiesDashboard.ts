import Page from '../page'

export default class ManageActivitiesDashboardPage extends Page {
  constructor() {
    super('manage-activities-dashboard')
  }

  allocateToActivityCard = (): Cypress.Chainable => cy.get('[data-qa=manage-allocations]')

  cardActivityCard = (): Cypress.Chainable => cy.get('[data-qa=create-an-activity]')
}
