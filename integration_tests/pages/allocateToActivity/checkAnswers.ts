import Page from '../page'

export default class CheckAnswersPage extends Page {
  constructor() {
    super('check-answers-page')
  }

  confirmAllocation = () => cy.get('button').contains('Confirm this allocation').click()

  confirmDeallocation = () => cy.get('button').contains('Confirm and remove').click()

  cancel = () => cy.get('a').contains('Cancel and return to the list of candidates').click()

  location = (): Cypress.Chainable =>
    cy.get('.govuk-grid-column-two-thirds > :nth-child(1) > :nth-child(3) > .govuk-summary-list__value')
}
