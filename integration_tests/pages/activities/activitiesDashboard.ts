import Page from '../page'

export default class ActivitiesDashboardPage extends Page {
  constructor() {
    super('manage-schedules-activities-page')
  }

  outsideWorkNavigation = (): Cypress.Chainable => cy.get('[data-qa=moj-sub-navigation]')

  inPrisonActivitiesLink = (): Cypress.Chainable =>
    this.outsideWorkNavigation().get('a').contains('In-prison activities')

  outsideActivitiesLink = (): Cypress.Chainable => this.outsideWorkNavigation().get('a').contains('Outside activities')

  locationHeading = (): Cypress.Chainable => cy.get('[data-qa=location-heading]')

  activityTable = (): Cypress.Chainable => cy.get('[data-qa="activities-table"]')

  getActivitiesCount = (): Cypress.Chainable =>
    this.activityTable()
      .find('tbody tr')
      .then(rows => cy.wrap(rows.length))

  clickActivityByName = (activityName: string): Cypress.Chainable => cy.get('table').contains('a', activityName).click()

  noActivitiesMessage = (): Cypress.Chainable =>
    cy.get('p.govuk-body-l[data-qa="no-activities"]').contains('There are no')

  hasOutsideWorkContent = () => {
    this.locationHeading().should('exist')
    this.locationHeading().contains(/^(In-prison|Outside) activities$/)
    this.outsideWorkNavigation().should('exist')
  }

  hasInPrisonContent = () => {
    this.locationHeading().should('not.exist')
    this.outsideWorkNavigation().should('not.exist')
  }
}
