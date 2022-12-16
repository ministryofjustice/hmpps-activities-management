import Page from '../page'

export default class IdentifyCandidatesTabPage extends Page {
  constructor() {
    super('identify-candidates-page')
  }

  candidateRows = (): Cypress.Chainable =>
    cy
      .get('.govuk-table__body')
      .find('tr')
      .then($el => {
        return Cypress.$.makeArray($el).filter((row, index) => index % 2 === 0)
      })

  selectCandidateWithName = (name: string): Cypress.Chainable =>
    this.candidateRows()
      .filter((k, tr) => {
        return tr.children.item(0).innerHTML === name
      })
      .find('a')
      .click()
}
