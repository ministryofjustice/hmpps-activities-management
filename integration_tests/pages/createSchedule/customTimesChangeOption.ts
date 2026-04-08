import Page from '../page'

export default class CustomTimesChangeOptionPage extends Page {
  constructor() {
    super('custom-times-change-option-page')
  }

  caption = (): Cypress.Chainable => cy.get('[data-qa=caption]')

  changeDaysAndSessions = (text: string) => this.getInputByLabel(text).click()
}
