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
      'Edit appointment details, add and remove people, cancel and copy appointments, and print movement slips.',
    )

  viewAppointmentsAttendanceSummaryCard = (): Cypress.Chainable =>
    cy.cardIsDisplayed(
      '[data-qa=view-appointments-attendance-summary-card]',
      'View appointments attendance summary',
      'See attendance figures, including details of who did not attend, where attendance has not been recorded yet, tiers, and cancellations.',
    )

  recordAppointmentsAttendanceCard = (): Cypress.Chainable =>
    cy.cardIsDisplayed(
      '[data-qa=record-appointment-attendance-card]',
      'Record appointment attendance',
      'Record, view and change appointment attendance.',
    )
}
