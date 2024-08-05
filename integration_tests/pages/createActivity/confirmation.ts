import Page from '../page'

export default class ConfirmationPage extends Page {
  constructor() {
    super('confirmation-page')
  }

  payReviewLink = () => cy.get('[data-qa=review-pay-link]')
}
