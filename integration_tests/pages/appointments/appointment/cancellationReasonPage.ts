import Page from '../../page'

export default class CancellationReasonPage extends Page {
  constructor() {
    super('appointment-cancellation-reason-page')
  }

  caption = (): Cypress.Chainable => cy.get('[data-qa=caption]')

  yesShowAppointmentRadioClick = (): Cypress.Chainable => cy.get('#reason').click()

  noCancelAndDeleteRadioClick = (): Cypress.Chainable => cy.get('#reason-2').click()
}
