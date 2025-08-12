import Page from '../page'

export default class CancelSinglePaymentPage extends Page {
  constructor() {
    super('cancel-single-session-payment-page')
  }

  issuePayment = (text: string) => this.getInputByLabel(text).click()
}
