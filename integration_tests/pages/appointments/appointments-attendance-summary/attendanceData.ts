import Page from '../../page'

export default class AttendanceData extends Page {
  constructor() {
    super('appointments-attendance-data')
  }

  title = (): Cypress.Chainable => cy.get('[data-qa="title"]')

  subTitle = (): Cypress.Chainable => cy.get('[data-qa="subTitle"]')

  noResults = (): Cypress.Chainable => cy.get('[data-qa="no-results"]')

  table = (): Cypress.Chainable => cy.get('[data-qa="appointment-attendance-data"]')

  searchBar = (): Cypress.Chainable => cy.get('#search-input')

  appointmentName = (appId: number): Cypress.Chainable => cy.get(`[data-qa="appointmentName-${appId}"]`)
}
