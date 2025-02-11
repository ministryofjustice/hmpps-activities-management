import Page from '../page'

export default class DeallocationCheckAndConfirmPage extends Page {
  constructor() {
    super('deallocation-check-and-confirm-page')
  }

  assertSummaryDetail = (header: string, value: string) =>
    this.assertSummaryListValue('confirm-deallocation', header, value)

  confirmDeallocation = () => cy.get('button').contains('Confirm and remove').click()
}
