import Page from '../page'

export default class PayOptionPage extends Page {
  constructor() {
    super('create-activity-pay-option-page')
  }

  selectPayOption = (option: string) => this.getInputByLabel(option).click()
}
