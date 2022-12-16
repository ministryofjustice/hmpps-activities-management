import Page from '../page'

export default class ScheduleTabPage extends Page {
  constructor() {
    super('schedule-page')
  }

  tabWithTitle = (title: string) => cy.get('.govuk-tabs__tab').contains(title)
}
