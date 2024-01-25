import Page from '../page'

export default class AppointmentsManagementPage extends Page {
  constructor() {
    super('appointments-management-page')
  }

  createGroupAppointmentCard = (): Cypress.Chainable => cy.get('[data-qa=create-group-appointment-card]')
}
