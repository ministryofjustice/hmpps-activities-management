import Page from '../../page'

export default class HowToRecordAttendancePage extends Page {
  constructor() {
    super('how-to-record-attendance-page')
  }

  radioActivityClick = (): Cypress.Chainable => cy.get('#howToRecord').click() // would need changing if we reintroduced activity option

  radioActivityLocationClick = (): Cypress.Chainable => cy.get('#howToRecord-2').click() // would need changing if we reintroduced activity location option

  fullListClick = (): Cypress.Chainable => cy.get('#howToRecord').click()

  radioResidentialLocationClick = (): Cypress.Chainable => cy.get('#howToRecord-2').click()
}
