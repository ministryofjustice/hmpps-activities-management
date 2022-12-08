import Page from '../page'

export default class ActivitiesPage extends Page {
  constructor() {
    super('activities-page')
  }

  activityRows = (): Cypress.Chainable =>
    cy
      .get('.govuk-table__body')
      .find('tr')
      .then($el => {
        return Cypress.$.makeArray($el)
      })

  selectActivityWithName = (activityName: string) => this.activityRows().find(`a:contains(${activityName})`).click()
}
