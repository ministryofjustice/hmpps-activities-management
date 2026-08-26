import Page from '../../page'

export default class ConfirmationPage extends Page {
  constructor() {
    super('appointment-scheduled-confirmation-page')
  }

  viewAppointmentLink = () => cy.get('[data-qa=view-appointment-link]')

  assertMessageEquals = (message: string) => cy.get('[data-qa=message]').contains(message)

  assertCreateLinkExists = () => cy.get('[data-qa=create-another-link]').contains('Schedule an appointment')

  assertRecordAttendanceLinkExists = () =>
    cy.get('[data-qa=record-attendance-link]').contains('Record appointment attendance')

  assertViewAppointmentLinkExists = () =>
    this.viewAppointmentLink().contains('View, print movement slips and manage this appointment')

  assertViewAppointmentLinkDoesNotExist = () => this.viewAppointmentLink().should('not.exist')
}
