import Page from '../page'

export default class CancelSessionPage extends Page {
  constructor() {
    super('cancel-session-reason-page')
  }

  title = () => cy.get('.govuk-heading-l')

  caption = () => cy.get('.govuk-caption-m')

  selectReason = (text: string) => this.getInputByLabel(text).click()

  moreDetailsInput = () => this.getInputById('comment')
}
