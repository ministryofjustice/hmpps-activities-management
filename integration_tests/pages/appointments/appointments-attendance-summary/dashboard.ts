import Page from '../../page'

export default class DashboardPage extends Page {
  constructor() {
    super('appointment-attendance-summary-stats-dashboard')
  }

  dateCaption = (): Cypress.Chainable => cy.get('.govuk-caption-l')

  appointmentsNotCancelledTotal = (): Cypress.Chainable => cy.get('[data-qa="appointmentsNotCancelledTotal"]')

  attendedStat = (): Cypress.Chainable => cy.get('[data-qa="attended"]')

  notAttendedStat = (): Cypress.Chainable => cy.get('[data-qa="notAttended"]')

  notRecordedStat = (): Cypress.Chainable => cy.get('[data-qa="notRecorded"]')

  tier1Stat = (): Cypress.Chainable => cy.get('[data-qa="tier1"]')

  tier2Stat = (): Cypress.Chainable => cy.get('[data-qa="tier2"]')

  foundationalStat = (): Cypress.Chainable => cy.get('[data-qa="foundational"]')

  cancelledStat = (): Cypress.Chainable => cy.get('[data-qa="cancelled"]')
}
