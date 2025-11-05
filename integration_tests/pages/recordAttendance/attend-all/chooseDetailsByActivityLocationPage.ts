import Page from '../../page'

export default class ChooseDetailsByActivityLocationPage extends Page {
  constructor() {
    super('choose-details-by-activity-location-page')
  }

  radioTodayClick = (): Cypress.Chainable => cy.get('#datePresetOption').click()

  radioTomorrowClick = (): Cypress.Chainable => cy.get('#datePresetOption-2').click()

  radioOtherClick = (): Cypress.Chainable => cy.get('datePresetOption-3').click()

  checkboxAMClick = (): Cypress.Chainable => cy.get('#timePeriod').click()

  checkboxPMClick = (): Cypress.Chainable => cy.get('#timePeriod-2').click()

  checkboxEDClick = (): Cypress.Chainable => cy.get('#timePeriod-3').click()

  radioSearchForLocationClick = (): Cypress.Chainable => cy.get('#locationType').click()

  searchBoxLocation = (): Cypress.Chainable => cy.get('#location')

  radioInCellClick = (): Cypress.Chainable => cy.get('#locationType-2').click()

  radioOffWingClick = (): Cypress.Chainable => cy.get('#locationType-3').click()

  radioOnWingClick = (): Cypress.Chainable => cy.get('#locationType-4').click()

  selectLocation = (location: string) => cy.get(`[value="${location}"]`).click()
}
