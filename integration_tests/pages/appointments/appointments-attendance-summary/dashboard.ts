import Page from '../../page'

export default class DashboardPage extends Page {
  constructor() {
    super('appointment-attendance-summary-stats-dashboard')
  }

  dateCaption = (): Cypress.Chainable => cy.get('.govuk-caption-l')

  appointmentsNotCancelledTotal = (): Cypress.Chainable => cy.get('[data-qa="appointmentsNotCancelledTotal"]')

  attendedStat = (): Cypress.Chainable => cy.get('[data-qa="attended"]')

  attendedStatLink = (): Cypress.Chainable => cy.get('[data-qa="attended-link"]')

  notAttendedStat = (): Cypress.Chainable => cy.get('[data-qa="notAttended"]')

  notAttendedStatLink = (): Cypress.Chainable => cy.get('[data-qa="notAttended-link"]')

  notRecordedStat = (): Cypress.Chainable => cy.get('[data-qa="notRecorded"]')

  notRecordedStatLink = (): Cypress.Chainable => cy.get('[data-qa="notRecorded-link"]')

  tier1Stat = (): Cypress.Chainable => cy.get('[data-qa="tier1"]')

  tier1StatLink = (): Cypress.Chainable => cy.get('[data-qa="tier1-link"]')

  tier2Stat = (): Cypress.Chainable => cy.get('[data-qa="tier2"]')

  tier2StatLink = (): Cypress.Chainable => cy.get('[data-qa="tier2-link"]')

  routineStat = (): Cypress.Chainable => cy.get('[data-qa="routine"]')

  routineStatLink = (): Cypress.Chainable => cy.get('[data-qa="routine-link"]')

  cancelledStat = (): Cypress.Chainable => cy.get('[data-qa="cancelled"]')

  cancelledStatLink = (): Cypress.Chainable => cy.get('[data-qa="cancelled-link"]')
}
