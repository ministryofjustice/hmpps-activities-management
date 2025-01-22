import Page from '../../page'

export default class AttendanceDetailsPage extends Page {
  constructor() {
    super('appointment-attendance-details-page')
  }

  mainCaption = (): Cypress.Chainable => cy.get('[data-qa=caption]')

  title = (): Cypress.Chainable => cy.get('.govuk-heading-l')

  summary = (): Cypress.Chainable => cy.get('[data-qa=summary]')

  appointmentDetails = (): Cypress.Chainable => cy.get('[data-qa=appointment-details]')
}
