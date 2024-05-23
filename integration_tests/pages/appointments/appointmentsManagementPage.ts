import Page from '../page'

export default class AppointmentsManagementPage extends Page {
  constructor() {
    super('appointments-management-page')
  }

  createGroupAppointmentCard = (): Cypress.Chainable =>
    cy.cardIsDisplayed(
      '[data-qa=create-group-appointment-card]',
      'Schedule an appointment',
      'Set up a one-off or repeating appointment for one or more people.',
    )

  searchAppointmentsCard = (): Cypress.Chainable =>
    cy.cardIsDisplayed(
      '[data-qa=search-appointments-card]',
      'Manage existing appointments',
      'Edit the details of an appointment, including cancelling, adding and removing people, and printing movement slips.',
    )
}
