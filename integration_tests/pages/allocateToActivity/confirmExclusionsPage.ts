import Page from '../page'

export default class ConfirmExclusionsPage extends Page {
  constructor() {
    super('confirm-exclusions-page')
  }

  pageTitle = (): Cypress.Chainable => cy.get('h1.govuk-heading-l')

  excludedSessionsValue = (): Cypress.Chainable =>
    cy
      .contains('.govuk-summary-list__key', `Sessions you’re excluding`)
      .closest('.govuk-summary-list__row')
      .find('.govuk-summary-list__value')

  changeLink = (index: number): Cypress.Chainable => cy.get('a').filter(':contains("Change")').eq(index)

  bodyText = (): Cypress.Chainable => cy.get('body')

  confirm = () => cy.get('button').contains('Confirm').click()
}
