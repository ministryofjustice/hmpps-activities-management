import Page from '../page'

export default class ActivitiesDashboardPage extends Page {
  constructor() {
    super('manage-schedules-activities-page')
  }

  outsideWorkNavigation = (): Cypress.Chainable => cy.get('[data-qa=moj-sub-navigation]')

  inPrisonActivitiesLink = (): Cypress.Chainable =>
    this.outsideWorkNavigation().get('a').contains('In-prison activities')

  outsideActivitiesLink = (): Cypress.Chainable => this.outsideWorkNavigation().get('a').contains('Outside activities')

  inPrisonH2 = (): Cypress.Chainable => cy.get('h2').contains('In-prison activities')

  outsideH2 = (): Cypress.Chainable => cy.get('h2').contains('Outside activities')

  activityTable = (): Cypress.Chainable => cy.get('[data-qa="activities-table"]')

  getActivitiesCount = (): Cypress.Chainable =>
    this.activityTable()
      .find('tbody tr')
      .then(rows => cy.wrap(rows.length))

  clickActivityByName = (activityName: string): Cypress.Chainable => cy.get('table').contains('a', activityName).click()

  noActivitiesMessage = (): Cypress.Chainable =>
    cy.get('p.govuk-body-l[data-qa="no-activities"]').contains('There are no')
}
