import Page from '../../page'

export default class ReviewPrisonersPage extends Page {
  constructor() {
    super('appointments-create-review-prisoners-page')
  }

  addAnotherPrisoner = () => cy.get('[data-qa="add-prisoner-secondary"]').contains('Add another person').click()

  assertPrisonerInList = (name: string) =>
    cy.get('[data-qa="prisoners-list-table"]').find('tr td:nth-child(1)').contains(name)

  finishAddingPrisoners = () => cy.get('[data-qa="finish-adding-prisoners"]').contains('Continue').click()
}
