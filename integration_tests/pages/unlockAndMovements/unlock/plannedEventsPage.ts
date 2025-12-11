import AbstractEventsPage from '../abstractEventsPage'

export default class PlannedEventsPage extends AbstractEventsPage {
  constructor() {
    super('planned-events-page')
  }

  categoryCheckbox = (cat: string) => cy.get(`[name=activityCategoriesFilters][value="${cat}"]`)

  selectAllCategories = () => cy.get('a[data-checkbox-name="activityCategoriesFilters"]')

  table = (): Cypress.Chainable => cy.get('#unlock-list-table')

  linkToAttendance = () => cy.get('a').contains('Record activity attendance for people on')

  appointmentLinkIsPresent = (identifier: string) =>
    cy.get(`a[href="/appointments/${identifier}?preserveHistory=true"]`).should('exist')

  extraInfoTagIsPresent = (identifier: string) => cy.get(`[data-qa="extra-info-tag-${identifier}"]`).should('exist')
}
