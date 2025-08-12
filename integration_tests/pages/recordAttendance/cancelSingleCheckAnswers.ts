import Page from '../page'

export default class CancelSingleCheckAnswersPage extends Page {
  constructor() {
    super('check-single-cancellation-details-page')
  }

  assertCancellationDetail = (header: string, value: string) =>
    this.assertSummaryListValue('cancellation-details', header, value)

  expandSessionsSummary = () => cy.get('.govuk-details .govuk-details__summary-text').click()

  confirmCancellationButton = () => cy.get('button').contains('Confirm activity cancellation')
}
