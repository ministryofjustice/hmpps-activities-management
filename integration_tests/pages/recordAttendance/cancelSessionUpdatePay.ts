import Page from '../page'

export default class CancelledSessionUpdatePayPage extends Page {
  constructor() {
    super('cancelled-session-update-payment-page')
  }

  title = () => cy.get('.govuk-heading-l')

  issuePayment = (text: string) => this.getInputByLabel(text).click()
}
