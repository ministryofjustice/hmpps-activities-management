import Page from '../page'

export default class PayBandMultiplePage extends Page {
  constructor() {
    super('pay-band-multiple-page')
  }

  selectPayBand = (text: string) => this.getInputById(text).click()
}
