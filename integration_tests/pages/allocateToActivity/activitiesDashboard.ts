import Page from '../page'

export default class ActivitiesDashboardPage extends Page {
  constructor() {
    super('manage-allocations-activities-page')
  }

  activityRows = (): Cypress.Chainable => cy.get('.govuk-table__body').find('tr')

  outsideActivities = (): Cypress.Chainable => cy.get(':nth-child(2) > .moj-sub-navigation__link')

  selectActivityWithName = (activityName: string) => this.activityRows().find(`a:contains(${activityName})`).click()
}
