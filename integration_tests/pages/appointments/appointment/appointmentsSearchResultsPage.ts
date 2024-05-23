import Page from '../../page'

export default class SearchResultsPage extends Page {
  constructor() {
    super('appointments-search-results-page')
  }

  searchResultsTable = (): Cypress.Chainable => cy.get('table[data-qa=search-results]')

  assertResultsLocation = (row: number, expected: string) => {
    this.searchResultsTable().find(`td[data-qa=result-location-${row}]`).contains(expected)
  }

  viewLink = (row: number): Cypress.Chainable =>
    this.searchResultsTable().find(`td[data-qa=view-and-edit-result-${row}]`)
}
