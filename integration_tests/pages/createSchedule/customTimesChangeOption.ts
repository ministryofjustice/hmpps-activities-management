import Page from '../page'

export default class CustomTimesChangeOptionPage extends Page {
  constructor() {
    super('custom-times-change-option-page')
  }

  changeDaysAndSessions = (text: string) => this.getInputByLabel(text).click()
}
