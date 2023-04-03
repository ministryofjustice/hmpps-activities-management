import Page from '../../page'

export default class ReviewPrisonersPage extends Page {
  constructor() {
    super('appointments-create-review-prisoners-page')
  }

  selectAddAnotherPrisoner = (text: string) => this.getInputByLabel(text).click()

  assertPrisonerInList = (name: string) =>
    cy.get('[data-qa="prisoners-list-table"]').find('tr td:nth-child(1)').contains(name)
}
