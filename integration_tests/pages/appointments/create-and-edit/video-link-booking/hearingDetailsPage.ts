import Page from '../../../page'

export default class HearingDetailsPage extends Page {
  constructor() {
    super('hearing-details-page')
  }

  selectCourt = (court: string) => this.getInputById('courtCode').clear().type(court)

  selectHearingType = (hearingType: string) => this.getInputById('hearingTypeCode').clear().type(hearingType)
}
