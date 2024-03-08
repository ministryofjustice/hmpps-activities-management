import Page from '../../page'

export default class SearchResultsPage extends Page {
  constructor() {
    super('appointments-search-results-page')
  }

  assertResultsLocation = (row: number, expected: string) => {
    cy.get('table[data-qa=search-results]').find(`td[data-qa=result-location-${row}]`).contains(expected)
  }
}
