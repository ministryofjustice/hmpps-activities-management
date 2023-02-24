import Page from '../page'

export default class ActivitiesDashboardPage extends Page {
  constructor() {
    super('allocate-to-activity-activities-page')
  }

  activityRows = (): Cypress.Chainable =>
    cy
      .get('.govuk-table__body')
      .find('tr')
      .then($el => {
        return Cypress.$.makeArray($el).slice(0, -1)
      })

  selectActivityWithName = (activityName: string) => this.activityRows().find(`a:contains(${activityName})`).click()
}
