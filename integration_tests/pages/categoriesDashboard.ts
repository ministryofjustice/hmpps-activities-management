import Page from './page'

export default class CategoriesDashboardPage extends Page {
  constructor() {
    super('allocate-to-activity-categories-page')
  }

  categoryRows = (): Cypress.Chainable =>
    cy
      .get('.govuk-table__body')
      .find('tr')
      .then($el => {
        return Cypress.$.makeArray($el).slice(1)
      })

  selectCategoryWithName = (categoryName: string) => this.categoryRows().find(`a:contains(${categoryName})`).click()
}
