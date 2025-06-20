import Page from '../../../page'

export default class CourtHearingLinkPage extends Page {
  constructor() {
    super('court-hearing-link-page')
  }

  selectYesToCvpLink = () => this.getInputById('cvpRequired').click()

  enterCvpLink = (link: string) => this.getInputById('videoLinkUrl').clear().type(link)

  selectYesToGuestPin = () => this.getInputById('guestPinRequired').click()

  enterGuestPin = (pin: string) => this.getInputById('guestPin').clear().type(pin)
}
