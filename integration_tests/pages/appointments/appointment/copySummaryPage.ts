import Page from '../../page'

export default class CopySummaryPage extends Page {
  constructor() {
    super('copy-appointment-page')
  }

  firstParagraphText = (text: string): Cypress.Chainable => cy.get('[data-qa=first-paragraph]').contains(text)

  cancelLink = (): Cypress.Chainable => cy.get('a').contains('Cancel and return to appointment')
}
