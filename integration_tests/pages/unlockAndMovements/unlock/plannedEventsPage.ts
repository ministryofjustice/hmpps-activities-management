import AbstractEventsPage from '../abstractEventsPage'

export default class PlannedEventsPage extends AbstractEventsPage {
  constructor() {
    super('planned-events-page')
  }

  categoryCheckbox = (cat: string) => cy.get(`[name=activityCategoriesFilters][value="${cat}"]`)

  selectAllCategories = () => cy.get('a[data-checkbox-name="activityCategoriesFilters"]')

  table = (): Cypress.Chainable => cy.get('#unlock-list-table')
}
