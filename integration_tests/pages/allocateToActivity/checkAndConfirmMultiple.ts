import Page from '../page'

export default class CheckAndConfirmMultiplePage extends Page {
  constructor() {
    super('check-and-confirm-multiple-page')
  }

  selectConfirm = (text: string) => cy.get('button').contains(text)

  inmatePayRows = (): Cypress.Chainable =>
    cy
      .get(`[data-qa="prisoner-pay-list"]`)
      .find('.govuk-table__body')
      .find('tr')
      .then($el => {
        return Cypress.$.makeArray($el)
      })
}
