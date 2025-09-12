import Page from '../../page'

export default class HowToRecordAttendancePage extends Page {
  constructor() {
    super('how-to-record-attendance-page')
  }

  radioActivityClick = (): Cypress.Chainable => cy.get('#howToRecord').click()

  radioActivityLocationClick = (): Cypress.Chainable => cy.get('#howToRecord-2').click()

  radioResidentialLocationClick = (): Cypress.Chainable => cy.get('howToRecord-3').click()
}
