import Page from '../page'

export default class CancelSessionConfirmPage extends Page {
  constructor() {
    super('cancel-session-confirm-page')
  }

  selectConfirmation = (text: string) => this.getInputByLabel(text).click()
}
