import Page from '../page'

export default class ScheduleTabPage extends Page {
  constructor() {
    super('schedule-page')
  }

  activeTimeSlots = () => cy.get('.govuk-table__cell > .govuk-tag').contains('Yes')

  tabWithTitle = (title: string) => cy.get('.govuk-tabs__tab').contains(title)
}
