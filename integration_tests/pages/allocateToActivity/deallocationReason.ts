import Page from '../page'

export default class DeallocationReasonPage extends Page {
  constructor() {
    super('deallocation-reason-page')
  }

  selectDeallocationReason = (text: string) => this.getInputByLabel(text).click()
}
