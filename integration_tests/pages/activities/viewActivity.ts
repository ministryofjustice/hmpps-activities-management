import Page from '../page'

export default class ViewActivityPage extends Page {
  constructor() {
    super('view-activity-page')
  }

  pageHeading = (): Cypress.Chainable => cy.get('h1.govuk-heading-l').contains('Edit activity details')

  activityDetailsSummaryList = (): Cypress.Chainable => cy.get('[data-qa="activity-details-summary-list"]')

  locationAndCapacitySummaryList = (): Cypress.Chainable => cy.get('[data-qa="location-and-capacity-summary-list"]')

  requirementsAndSuitabilitySummaryList = (): Cypress.Chainable =>
    cy.get('[data-qa="requirements-and-suitability-summary-list"]')

  payRatesSummaryList = (): Cypress.Chainable => cy.get('[data-qa="pay-rates-summary-list"]')

  scheduleSummaryList = (): Cypress.Chainable => cy.get('[data-qa="schedule-summary-list"]')

  getSummaryListValue = (cardElement: Cypress.Chainable, key: string): Cypress.Chainable =>
    cardElement.contains('dt', key).parent().find('dd').first()

  changeCategoryLink = (): Cypress.Chainable => cy.get('[data-qa="change-category-link"]')

  changeActivityNameLink = (): Cypress.Chainable => cy.get('[data-qa="change-activity-name-link"]')

  changeTierLink = (): Cypress.Chainable => cy.get('[data-qa="change-tier-link"]')

  changeOrganiserLink = (): Cypress.Chainable => cy.get('[data-qa="change-organiser-link"]')

  changeAttendanceRequiredLink = (): Cypress.Chainable => cy.get('[data-qa="change-attendance-required-link"]')

  changeLocationLink = (): Cypress.Chainable => cy.get('[data-qa="change-location-link"]')

  changeCapacityLink = (): Cypress.Chainable => cy.get('[data-qa="change-capacity-link"]')

  changeRiskLevelLink = (): Cypress.Chainable => cy.get('[data-qa="change-risk-level-link"]')

  changeEducationLevelLink = (): Cypress.Chainable => cy.get('[data-qa="change-education-level-link"]')

  changePayLink = (): Cypress.Chainable => cy.get('[data-qa="change-pay-link"]')

  changeStartDateLink = (): Cypress.Chainable => cy.get('[data-qa="change-start-date-link"]')

  changeEndDateLink = (): Cypress.Chainable => cy.get('[data-qa="change-end-date-link"]')

  changeScheduleLink = (): Cypress.Chainable => cy.get('[data-qa="change-schedule-link"]')

  changeBankHolidayLink = (): Cypress.Chainable => cy.get('[data-qa="change-bank-holiday-link"]')

  returnToDashboardLink = (): Cypress.Chainable => cy.get('a').contains('Return to dashboard')

  getActivityCategoryValue = (): Cypress.Chainable =>
    this.getSummaryListValue(this.activityDetailsSummaryList(), 'Activity category')

  getActivityNameValue = (): Cypress.Chainable =>
    this.getSummaryListValue(this.activityDetailsSummaryList(), 'Activity name')

  getTierValue = (): Cypress.Chainable => this.getSummaryListValue(this.activityDetailsSummaryList(), 'Tier')

  getLocationValue = (): Cypress.Chainable =>
    this.getSummaryListValue(this.locationAndCapacitySummaryList(), 'Location')

  getCapacityValue = (): Cypress.Chainable =>
    this.getSummaryListValue(this.locationAndCapacitySummaryList(), 'Capacity')

  getRiskLevelValue = (): Cypress.Chainable =>
    this.getSummaryListValue(
      this.requirementsAndSuitabilitySummaryList(),
      'Suitable for workplace risk assessment level',
    )

  getStartDateValue = (): Cypress.Chainable => this.getSummaryListValue(this.scheduleSummaryList(), 'Start date')

  getEndDateValue = (): Cypress.Chainable => this.getSummaryListValue(this.scheduleSummaryList(), 'End date')

  getRepeatsValue = (): Cypress.Chainable => this.getSummaryListValue(this.scheduleSummaryList(), 'Repeats')

  getPaidByValue = (): Cypress.Chainable => this.getSummaryListValue(this.activityDetailsSummaryList(), 'Paid by')

  insetText = (): Cypress.Chainable => cy.get('.govuk-inset-text')
}
