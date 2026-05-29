import AbstractEventsPage from '../abstractEventsPage'

export default class LocationEventsPage extends AbstractEventsPage {
  constructor() {
    super('movement-list-location-events-page')
  }

  heading = (): Cypress.Chainable => cy.get('h1')

  peopleCount = (): Cypress.Chainable => cy.get('[data-qa="people-count"]')

  table = (): Cypress.Chainable => cy.get('[data-qa="location-1-prisoner-events"]')

  appointmentLinkIsPresent = (identifier: string) => cy.get(`a[href="/appointments/${identifier}"]`).should('exist')

  extraInfoTagIsPresent = (identifier: string) => cy.get(`[data-qa="extra-info-tag-${identifier}"]`).should('exist')

  extraInfoTagIsAbsent = (identifier: string) => cy.get(`[data-qa="extra-info-tag-${identifier}"]`).should('not.exist')
}
