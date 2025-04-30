import Page from '../page'

export default class CancelSessionConfirmPage extends Page {
  constructor() {
    super('cancel-session-confirm-page')
  }

  title = () => cy.get('.govuk-heading-l').contains('Are you sure you want to cancel the session?')

  caption = () =>
    cy.get('.govuk-caption-m').contains('Cancelling the session will record an acceptable absence for all prisoners.')

  selectConfirmation = (text: string) => this.getInputByLabel(text).click()
}
