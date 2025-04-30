import Page from '../page'

export default class UpdateCancelledSessionPayPage extends Page {
  constructor() {
    super('update-cancelled-session-payment-page')
  }

  title = () => cy.get('.govuk-heading-l')

  issuePayment = (text: string) => this.getInputByLabel(text).click()
}
