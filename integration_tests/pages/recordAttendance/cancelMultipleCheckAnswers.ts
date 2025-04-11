import Page from '../page'

export default class CancelMultipleCheckAnswersPage extends Page {
  constructor() {
    super('check-cancellation-details-page')
  }

  assertCancellationDetail = (header: string, value: string) =>
    this.assertSummaryListValue('cancellation-details', header, value)

  assertSummaryTableRow(rowNum, text) {
    cy.get('[data-qa="cancel-multiple-sessions-list"]')
      .find('td')
      .eq(rowNum - 1)
      .then($data => {
        expect($data.get(0).innerText).to.contain(text)
      })
  }

  checkSummaryTableHeader = (text: string) => {
    cy.get('[data-qa="cancel-multiple-sessions-list"]')
      .find('th')
      .then($data => {
        expect($data.get(0).innerText).to.contain(text)
      })
  }

  expandSessionsSummary = () => cy.get('details').click()

  confirmCancellationButton = () => cy.get('button').contains('Confirm activity cancellations')
}
