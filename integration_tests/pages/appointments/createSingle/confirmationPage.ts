import Page from '../../page'

export default class ConfirmationPage extends Page {
  constructor() {
    super('appointments-create-single-confirmation-page')
  }

  assertMessageEquals = (message: string) => cy.get('[data-qa=message]').contains(message)

  assertCreateAnotherLinkExists = () => cy.get('[data-qa=create-another-link]').contains('Create another appointment')

  assertViewAppointmentLinkExists = () =>
    cy.get('[data-qa=view-appointment-link]').contains('View and edit appointment details')
}
