import Page from '../page'

export default class CancelMultiplePaymentPage extends Page {
  constructor() {
    super('cancel-multiple-session-payment-page')
  }

  issuePayment = (text: string) => this.getInputByLabel(text).click()
}
