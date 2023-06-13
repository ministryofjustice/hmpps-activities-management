import Page from '../page'

export default class EndDateOptionPage extends Page {
  constructor() {
    super('allocation-end-date-option-page')
  }

  addEndDate = (text: string) => this.getInputByLabel(text).click()
}
