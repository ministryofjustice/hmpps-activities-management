import Page from '../page'

export default class ConfirmationPage extends Page {
  constructor() {
    super('confirmation-page')
  }

  allocateLink = () => cy.get('[data-qa=allocate-link]')

  payReviewLink = () => cy.get('[data-qa=review-pay-link]')
}
