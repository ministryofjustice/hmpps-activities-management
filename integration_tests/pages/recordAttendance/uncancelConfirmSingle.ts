import Page from '../page'

export default class UncancelConfirmSinglePage extends Page {
  constructor() {
    super('uncancel-sessions-confirm-single-page')
  }

  title = (activityName: string) =>
    cy.get('.govuk-heading-l').contains(`Are you sure you want to uncancel ${activityName}?`)

  selectYes = () => this.getInputByLabel('Yes').click()

  selectNo = () => this.getInputByLabel('No').click()
}
