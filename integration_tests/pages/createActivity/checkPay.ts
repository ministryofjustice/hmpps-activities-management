import Page from '../page'

export default class CheckPayPage extends Page {
  constructor() {
    super('check-pay-page')
  }

  payRows = (): Cypress.Chainable =>
    cy.get('.govuk-summary-list__row').then($el => {
      return Cypress.$.makeArray($el)
    })

  confirmPayRates = () => cy.get('button').contains('Confirm pay rates').click()

  addAnother = () => cy.get('a').contains('Add another pay rate').click()
}
