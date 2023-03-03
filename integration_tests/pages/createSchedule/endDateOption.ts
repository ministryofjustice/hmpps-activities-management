import Page from '../page'

export default class EndDateOptionPage extends Page {
  constructor() {
    super('create-schedule-end-date-option-page')
  }

  addEndDate = (text: string) => this.getInputByLabel(text).click()
}
