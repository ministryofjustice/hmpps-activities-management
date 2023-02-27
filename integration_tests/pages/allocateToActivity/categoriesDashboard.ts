import Page from '../page'

export default class CategoriesDashboardPage extends Page {
  constructor() {
    super('allocate-to-activity-categories-page')
  }

  categoryHeaders = (): Cypress.Chainable => cy.get('thead').find('tr')

  categoryRows = (): Cypress.Chainable => cy.get('.govuk-table__body').find('tr')

  selectCategoryWithName = (categoryName: string) => this.categoryRows().find(`a:contains(${categoryName})`).click()

  sortByTableHeader = (headerName: string) => this.categoryHeaders().find(`th button:contains(${headerName})`).click()
}
