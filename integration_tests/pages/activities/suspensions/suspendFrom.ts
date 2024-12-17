import Page from '../../page'

export default class SuspendFromPage extends Page {
  constructor() {
    super('suspend-from-page')
  }

  caption = (): Cypress.Chainable => cy.get('.govuk-caption-xl')

  title = (): Cypress.Chainable => cy.get('.govuk-heading-l')

  selectRadio = (option: string) => this.getInputByName('datePresetOption').check(option).click()
}
