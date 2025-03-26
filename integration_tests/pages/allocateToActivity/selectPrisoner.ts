import Page from '../page'

export default class SelectPrisonerPage extends Page {
  constructor() {
    super('activities-allocate-multiple-select-prisoner-page')
  }

  caption = (): Cypress.Chainable => cy.get('.govuk-caption-xl')

  enterQuery = (text: string) => this.getInputByName('query').type(text)

  selectRadio = (prisonerNumber: string) => this.getInputByName('selectedPrisoner').check(prisonerNumber)

  selectPrisonerAndContinue = () => cy.get('button:contains("Select and continue")').click()

  addAnotherPersonLink = () => cy.get('#add-prisoner').contains('Add another person').click()

  inmateRows = (): Cypress.Chainable =>
    cy
      .get(`[data-qa="prisoner-list"]`)
      .find('.govuk-table__body')
      .find('tr')
      .then($el => {
        return Cypress.$.makeArray($el)
      })
}
