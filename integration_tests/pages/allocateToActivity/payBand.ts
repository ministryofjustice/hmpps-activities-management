import Page from '../page'

export default class PayBandPage extends Page {
  constructor() {
    super('pay-band-page')
  }

  selectPayBand = (text: string) => this.getInputByLabel(text).click()

  confirmPay = () => cy.get('button').contains('Confirm pay').click()
}
