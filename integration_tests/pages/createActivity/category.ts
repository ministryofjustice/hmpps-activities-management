import Page from '../page'

export default class CategoryPage extends Page {
  constructor() {
    super('category-page')
  }

  caption = (): Cypress.Chainable => cy.get('[data-qa=caption]')

  categoryLabels = (): Cypress.Chainable => cy.get('[data-qa="category-radio-options"]').find('.govuk-label')

  selectCategory = (text: string) => this.getInputByLabel(text).click()
}
