import Page from '../page'

export default class AppointmentsManagementPage extends Page {
  constructor() {
    super('appointments-management-page')
  }

  createIndividualAppointmentCard = (): Cypress.Chainable => cy.get('[data-qa=create-individual-appointment-card]')
}
