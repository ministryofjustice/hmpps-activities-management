import Page from '../page'

export default class PayRateTypePage extends Page {
  constructor() {
    super('create-activity-pay-rate-type-page')
  }

  incentiveLevel = (text: string) => this.getInputByLabel(text).click()
}
