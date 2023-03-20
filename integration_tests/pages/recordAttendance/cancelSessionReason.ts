import Page from '../page'

export default class CancelSessionPage extends Page {
  constructor() {
    super('cancel-session-reason-page')
  }

  selectReason = (text: string) => this.getInputByLabel(text).click()

  moreDetailsInput = () => this.getInputById('comment')
}
