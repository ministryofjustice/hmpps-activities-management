import Page from '../page'

export default class ActivityRequirementsReviewPage extends Page {
  constructor() {
    super('activity-requirements-review-page')
  }

  caption = (): Cypress.Chainable => cy.get('.govuk-caption-l')
}
