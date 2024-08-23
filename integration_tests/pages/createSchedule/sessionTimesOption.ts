import Page from '../page'

export default class SessionTimesOptionPage extends Page {
  constructor() {
    super('session-times-option-page')
  }

  useSessionOption = (text: string) => this.getInputByLabel(text).click()
}
