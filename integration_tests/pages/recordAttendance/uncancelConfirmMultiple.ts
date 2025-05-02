import Page from '../page'

export default class UncancelConfirmMultiplePage extends Page {
  constructor() {
    super('uncancel-sessions-confirm-multiple-page')
  }

  title = (numberOfSessions: number) =>
    cy.get('.govuk-heading-l').contains(`Are you sure you want to uncancel ${numberOfSessions} activity sessions?`)

  selectYes = () => this.getInputByLabel('Yes').click()

  selectNo = () => this.getInputByLabel('No').click()
}
