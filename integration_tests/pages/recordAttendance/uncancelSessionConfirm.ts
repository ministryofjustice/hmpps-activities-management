import Page from '../page'

export default class UncancelSessionConfirmPage extends Page {
  constructor() {
    super('uncancel-session-confirm-page')
  }

  selectReason = (text: string) => this.getInputByLabel(text).click()

  selectConfirmation = (text: string) => this.getInputByLabel(text).click()
}
