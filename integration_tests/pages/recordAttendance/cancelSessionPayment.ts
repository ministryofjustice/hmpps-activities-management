import Page from '../page'

export default class CancelSessionPaymentPage extends Page {
  constructor() {
    super('cancelled-session-payment-page')
  }

  issuePayment = (text: string) => this.getInputByLabel(text).click()
}
