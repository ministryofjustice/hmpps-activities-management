import AbstractEventsPage from '../abstractEventsPage'

export default class LocationEventsPage extends AbstractEventsPage {
  constructor() {
    super('movement-list-location-events-page')
  }

  table = (): Cypress.Chainable => cy.get('[data-qa="location-1-prisoner-events"]')
}
