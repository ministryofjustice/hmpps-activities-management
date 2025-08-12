import Page from '../page'

export default class CancelSingleReasonPage extends Page {
  constructor() {
    super('cancel-single-session-reason-page')
  }

  caption = () =>
    cy
      .get('.govuk-caption-m')
      .contains('This will be recorded as an acceptable absence for everyone who was due to attend.')

  selectReason = (text: string) => this.getInputByLabel(text).click()

  moreDetailsInput = () => this.getInputById('comment')
}
