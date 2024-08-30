import Page from '../page'

export default class CustomTimesChangeDefaultCustomPage extends Page {
  constructor() {
    super('custom-times-change-default-or-custom-page')
  }

  changeTimes = (text: string) => this.getInputByLabel(text).click()
}
