import Page from '../../page'

export default class AllocateActivitySearchPage extends Page {
  constructor() {
    super('activity-search')
  }

  searchBox = (): Cypress.Chainable => cy.get('#activityId')
}
