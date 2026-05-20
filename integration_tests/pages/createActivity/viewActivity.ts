import Page from '../page'

export default class ViewActivityPage extends Page {
  constructor() {
    super('view-activity-page')
  }

  activityDetailsSummaryList = (): Cypress.Chainable => cy.get('[data-qa="activity-details-summary-list"]')

  locationAndCapacitySummaryList = (): Cypress.Chainable => cy.get('[data-qa="location-and-capacity-summary-list"]')

  requirementsAndSuitabilitySummaryList = (): Cypress.Chainable =>
    cy.get('[data-qa="requirements-and-suitability-summary-list"]')

  payRatesSummaryList = (): Cypress.Chainable => cy.get('[data-qa="pay-rates-summary-list"]')

  scheduleSummaryList = (): Cypress.Chainable => cy.get('[data-qa="schedule-summary-list"]')

  changeLocationLink = (): Cypress.Chainable => cy.get('[data-qa="change-location-link"]')

  changePayLink = () => cy.get('[data-qa="change-pay-link"]')

  changeScheduleLink = () => cy.get('[data-qa="change-schedule-link"]')

  changeBankHolidayLink = (): Cypress.Chainable => cy.get('[data-qa="change-bank-holiday-link"]')

  getSummaryListValue = (cardElement: Cypress.Chainable, key: string): Cypress.Chainable =>
    cardElement.contains('dt', key).parent().find('dd').first()

  isInPrisonActivity = () => {
    this.activityDetailsSummaryList().should('exist')
    this.locationAndCapacitySummaryList().should('exist')
    this.requirementsAndSuitabilitySummaryList().should('exist')
    this.payRatesSummaryList().should('exist')
    this.scheduleSummaryList().should('exist')
  }

  isOutsideActivity = () => {
    this.activityDetailsSummaryList().should('exist')
    this.locationAndCapacitySummaryList().should('exist')
    this.requirementsAndSuitabilitySummaryList().should('not.exist')
    this.payRatesSummaryList().should('exist')
    this.scheduleSummaryList().should('exist')
    this.getSummaryListValue(this.activityDetailsSummaryList(), 'Paid by').contains(/The Prison|An external employer/)
    this.getSummaryListValue(this.locationAndCapacitySummaryList(), 'Location').should('match', 'Outside')
    this.changeLocationLink().should('not.exist')
    this.changeBankHolidayLink().should('not.exist')
  }
}
