import Page from '../page'

export default class AttendanceDashboardPage extends Page {
  constructor() {
    super('record-attendance')
  }

  recordAttendanceCard = (): Cypress.Chainable =>
    cy.cardIsDisplayed(
      '[data-qa=record-attendance]',
      'Record attendance and cancel activity sessions',
      'Mark and update attendance. Cancel individual activity sessions.',
    )

  attendanceSummaryCard = (): Cypress.Chainable =>
    cy.cardIsDisplayed(
      '[data-qa=view-daily-attendance-summary]',
      'View daily attendance summary',
      'See daily attendance figures, including details of who is not attended yet, absent or suspended. Check details of cancelled sessions.',
    )
}
