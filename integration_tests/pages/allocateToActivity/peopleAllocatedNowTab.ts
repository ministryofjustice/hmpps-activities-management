import Page from '../page'

export default class PeopleAllocatedNowTabPage extends Page {
  constructor() {
    super('people-allocated-now-page')
  }

  allocatedPeopleRows = (): Cypress.Chainable =>
    cy
      .get('.govuk-table__body')
      .find('tr')
      .then($el => {
        return Cypress.$.makeArray($el)
      })

  tabWithTitle = (title: string) => cy.get('.govuk-tabs__tab').contains(title)
}
