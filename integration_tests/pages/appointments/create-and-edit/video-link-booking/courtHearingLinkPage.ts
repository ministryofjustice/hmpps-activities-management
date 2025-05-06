import Page from '../../../page'

export default class CourtHearingLinkPage extends Page {
  constructor() {
    super('court-hearing-link-page')
  }

  selectYes = () => this.getInputByLabel('Yes').click()

  selectNo = () => this.getInputByLabel('No').click()

  enterCvpLink = (link: string) => this.getInputById('videoLinkUrl').clear().type(link)
}
