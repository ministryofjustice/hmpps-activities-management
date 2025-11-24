import Page from '../page'

export default class DeallocationReasonOptionPage extends Page {
  constructor() {
    super('deallocation-change-reason-option-page')
  }

  panelHeader = () => cy.get('h1')

  changeDeallocationReason = (text: string) => this.getInputByLabel(text).click()
}
