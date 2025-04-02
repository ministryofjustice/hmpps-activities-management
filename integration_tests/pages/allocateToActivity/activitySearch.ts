import Page from '../page'

export default class SearchForActivityPage extends Page {
  constructor() {
    super('from-activity-list-page')
  }

  searchBox = (): Cypress.Chainable => cy.get('.autocomplete__input')
}
