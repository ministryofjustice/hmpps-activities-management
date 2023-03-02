export default class SummaryList {
  readonly componentId: string

  constructor(componentId: string) {
    this.componentId = componentId
  }

  component = (): Cypress.Chainable => cy.get(`#${this.componentId}`)

  getRow = rowIndex => this.component().find('.govuk-summary-list__row').eq(rowIndex)

  assertItem = (rowIndex, header, value) =>
    this.getRow(rowIndex).within(() => {
      cy.get('.govuk-summary-list__key').contains(header)
      cy.get('.govuk-summary-list__value').contains(value)
    })
}
