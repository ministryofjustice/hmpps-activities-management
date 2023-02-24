import Page from '../page'

export default class SchedulesDashboardPage extends Page {
  constructor() {
    super('allocate-to-activity-schedules-page')
  }

  scheduleRows = (): Cypress.Chainable =>
    cy
      .get('.govuk-table__body')
      .find('tr')
      .then($el => {
        return Cypress.$.makeArray($el).slice(0, -1)
      })

  selectScheduleWithName = (scheduleName: string) => this.scheduleRows().find(`a:contains(${scheduleName})`).click()
}
