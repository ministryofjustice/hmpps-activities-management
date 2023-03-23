import Page from '../../page'

export default class ConfirmationPage extends Page {
  constructor() {
    super('appointments-create-confirmation-page')
  }

  viewAppointmentLink = () => cy.get('[data-qa=view-appointment-link]')

  assertMessageEquals = (message: string) => cy.get('[data-qa=message]').contains(message)

  assertCreateAnotherLinkExists = () => cy.get('[data-qa=create-another-link]').contains('Create another appointment')

  assertViewAppointmentLinkExists = () => this.viewAppointmentLink().contains('View and edit appointment details')
}
