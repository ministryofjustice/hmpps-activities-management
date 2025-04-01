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

  checkTableCell = (table, cellNumber, contents) => {
    cy.get(`[data-qa=${table}]`)
      .find('td')
      .then($data => expect($data.get(cellNumber).innerText).to.contain(contents))
  }

  removeCandidateLink = (prn: string) => cy.get(`[data-qa=remove-uploaded-prison-number-${prn}]`)

  incentiveLevelTitle = () => cy.get(`[data-qa="incentive-level-title"]`)

  incentiveLevelText = () => cy.get(`[data-qa=incentive-level-text]`)

  alreadyAllocatedText = () => cy.get(`[data-qa=already-allocated-text]`)

  hasText = (text: string) => cy.contains(text)
}
