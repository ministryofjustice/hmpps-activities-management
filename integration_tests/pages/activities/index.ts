import Page from '../page'

export default class ActivitiesIndexPage extends Page {
  constructor() {
    super('activities-index-page')
  }

  allocateToActivitiesCard = (): Cypress.Chainable => cy.get('[data-qa=allocate-to-activities-card]')

  recordAttendanceCard = (): Cypress.Chainable => cy.get('[data-qa=record-attendance-card]')
}
