import Page from '../page'

export default class SelectPrisonerPage extends Page {
  constructor() {
    super('activities-allocate-multiple-select-prisoner-page')
  }

  caption = (): Cypress.Chainable => cy.get('.govuk-caption-xl')

  enterQuery = (text: string) => this.getInputByName('query').type(text)

  selectRadio = (prisonerNumber: string) => this.getInputByName('selectedPrisoner').check(prisonerNumber)

  selectPrisonerAndContinue = () => cy.get('#continue-button')

  addAnotherPersonLink = () => cy.get('add-prisoner').contains('Add another person').click()
}
