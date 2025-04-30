import Page from '../page'

export default class CancelSessionPage extends Page {
  constructor() {
    super('cancel-session-reason-page')
  }

  title = () => cy.get('.govuk-heading-l').contains('Why are you cancelling the session?')

  caption = () =>
    cy.get('.govuk-caption-m').contains('Prisoners will be paid and recorded as having an acceptable absence.')

  editTitle = () => cy.get('.govuk-heading-l').contains('Change the reason this session was cancelled')

  editCaption = () =>
    cy
      .get('.govuk-caption-m')
      .contains('This will be recorded as an acceptable absence for everyone who was due to attend.')

  selectReason = (text: string) => this.getInputByLabel(text).click()

  moreDetailsInput = () => this.getInputById('comment')
}
