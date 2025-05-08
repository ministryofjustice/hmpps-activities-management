import Page from '../../page'

export default class ReviewPrisonersPage extends Page {
  constructor() {
    super('appointment-review-prisoners-page')
  }

  addAnotherPrisoner = () => cy.get('[data-qa="add-prisoner-secondary"]').contains('Add another person').click()

  assertPrisonerInList = (name: string) =>
    cy.get('[data-qa="prisoners-list-table"]').find('tr td:nth-child(1)').contains(name)

  cancelLink = (): Cypress.Chainable => cy.get('a').contains('Cancel and return to appointment')

  missingPrisonersTitle = (): Cypress.Chainable => cy.get('h2')

  missingPrisonerList = (): Cypress.Chainable => cy.get('ul')
}
