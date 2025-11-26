import Page from '../../page'

export default class ChooseDetailsToRecordAttendancePage extends Page {
  constructor() {
    super('choose-details-by-activity-page')
  }

  radioTodayClick = (): Cypress.Chainable => cy.get('#datePresetOption').click()

  radioTomorrowClick = (): Cypress.Chainable => cy.get('#datePresetOption-2').click()

  radioOtherClick = (): Cypress.Chainable => cy.get('datePresetOption-3').click()

  checkboxAMClick = (): Cypress.Chainable => cy.get('#timePeriod').click()

  checkboxPMClick = (): Cypress.Chainable => cy.get('#timePeriod-2').click()

  checkboxEDClick = (): Cypress.Chainable => cy.get('#timePeriod-3').click()

  searchBox = (): Cypress.Chainable => cy.get('#activityId')
}
