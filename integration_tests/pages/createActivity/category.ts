import Page from '../page'

export default class CategoryPage extends Page {
  constructor() {
    super('category-page')
  }

  caption = (): Cypress.Chainable => cy.get('[data-qa=caption]')

  selectCategory = (text: string) => this.getInputByLabel(text).click()
}
