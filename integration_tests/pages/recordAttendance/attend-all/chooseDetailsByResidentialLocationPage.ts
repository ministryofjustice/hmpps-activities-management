import Page from '../../page'

export default class ChooseDetailsByActivityLocationPage extends Page {
  constructor() {
    super('choose-details-by-residential-location-page')
  }

  radioTodayClick = (): Cypress.Chainable => cy.get('#datePresetOption').click()

  radioTomorrowClick = (): Cypress.Chainable => cy.get('#datePresetOption-2').click()

  radioOtherClick = (): Cypress.Chainable => cy.get('datePresetOption-3').click()

  radioAMClick = (): Cypress.Chainable => cy.get('#timePeriod').click()

  radioPMClick = (): Cypress.Chainable => cy.get('#timePeriod-2').click()

  radioEDClick = (): Cypress.Chainable => cy.get('#timePeriod-3').click()

  selectLocation = (location: string) => cy.get(`[value="${location}"]`).click()
}
