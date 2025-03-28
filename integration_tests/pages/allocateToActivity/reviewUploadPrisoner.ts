import Page from '../page'

export default class ReviewUploadPrisonerListPage extends Page {
  constructor() {
    super('activities-allocate-multiple-review-upload-prisoner-list-page')
  }

  caption = (): Cypress.Chainable => cy.get('.govuk-caption-l')

  rows = (listId: string): Cypress.Chainable =>
    cy
      .get(`[data-qa="${listId}"]`)
      .find('.govuk-table__body')
      .find('tr')
      .then($el => {
        return Cypress.$.makeArray($el)
      })

  removeCandidateLink = (prn: string) => cy.get(`[data-qa=remove-uploaded-prison-number-${prn}]`)

  hasText = (text: string) => cy.contains(text)
}
