import Page from '../page'

export default class CheckPayPage extends Page {
  constructor() {
    super('check-pay-page')
  }

  payRows = (): Cypress.Chainable =>
    cy.get('.govuk-summary-list__row').then($el => {
      return Cypress.$.makeArray($el)
    })

  continuePayRates = () => cy.get('button').contains('Continue').click()

  addAnother = () => cy.get('a').contains('Add a pay rate').click()

  addNewPayRate = () => cy.get('a').contains('Add new pay rate').click()

  changePay = () => cy.get('a').contains('Change').click()

  cancelPay = () => cy.get('a').contains('Cancel').click()
}
