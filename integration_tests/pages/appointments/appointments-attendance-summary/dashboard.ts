import Page from '../../page'

export default class DashboardPage extends Page {
  constructor() {
    super('appointment-attendance-summary-stats-dashboard')
  }

  dateCaption = (): Cypress.Chainable => cy.get('.govuk-caption-l')
}
