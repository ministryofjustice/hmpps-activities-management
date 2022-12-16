import Page from '../page'

export default class PayBandPage extends Page {
  constructor() {
    super('pay-band-page')
  }

  selectPayBand = (text: string) => this.getInputByLabel(text).click()

  confirmPayAndContinue = () => cy.get('button').contains('Confirm pay and continue').click()
}
