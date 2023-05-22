import Page from '../../page'

export default class SelectPrisonerPage extends Page {
  constructor() {
    super('appointments-create-select-prisoner-page')
  }

  enterPrisonerNumber = (prisonerNumber: string) => this.getInputByName('query').clear().type(prisonerNumber)

  assertEnteredPrisonerNumber = (prisonerNumber: string) =>
    this.getInputByName('query').should('have.value', prisonerNumber)

  continueButton = () => cy.get('#continue-button')

  searchButton = () => cy.get(`button:contains("Search")`)
}
