import Page from '../page'

export default class AttendanceDashboardPage extends Page {
  constructor() {
    super('record-attendance')
  }

  recordAttendanceCard = (): Cypress.Chainable => cy.get('[data-qa=record-attendance]')

  attendanceSummaryCard = (): Cypress.Chainable => cy.get('[data-qa=view-daily-attendance-summary]')
}
