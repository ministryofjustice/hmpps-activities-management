import Page from '../../page'

export default class ReviewPrisonerAlertsPage extends Page {
  constructor() {
    super('appointment-review-prisoner-alert-page')
  }

  assertPrisonerInList = (name: string) =>
    cy.get('[data-qa="prisoners-list-table"]').find('tr td:nth-child(1)').contains(name)
}
