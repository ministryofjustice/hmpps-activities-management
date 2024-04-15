import Page from '../page'

export default class CancelSessionPage extends Page {
  constructor() {
    super('cancel-session-reason-page')
  }

  caption = () => cy.get('.govuk-caption-m').contains('Prisoners will be recorded as having an acceptable absence.')

  selectReason = (text: string) => this.getInputByLabel(text).click()

  moreDetailsInput = () => this.getInputById('comment')
}
