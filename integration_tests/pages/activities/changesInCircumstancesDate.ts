import Page from '../page'

export default class ChangesInCircumstancesDatePage extends Page {
  constructor() {
    super('select-period-for-changes-page')
  }

  datePresetOption = (): Cypress.Chainable => cy.get('[data-qa="datePresetOption"]')

  radioTodayClick = (): Cypress.Chainable => cy.get('#datePresetOption').click()

  radioYesterdayClick = (): Cypress.Chainable => cy.get('#datePresetOption-1').click()

  radioOtherClick = (): Cypress.Chainable => cy.get('#datePresetOption-2').click()
}
