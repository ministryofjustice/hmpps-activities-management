import Page from '../page'

export default class ActivitiesDashboardPage extends Page {
  constructor() {
    super('manage-allocations-activities-page')
  }

  activityRows = (): Cypress.Chainable => cy.get('.govuk-table__body').find('tr')

  selectActivityWithName = (activityName: string) => this.activityRows().find(`a:contains(${activityName})`).click()
}
