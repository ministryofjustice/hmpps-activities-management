import Page from '../../../page'

export default class ProbationMeetingDetailsPage extends Page {
  constructor() {
    super('meeting-details-page')
  }

  selectYesToProbationTeamKnown = () => this.getInputById('probationTeamRequired').click()

  selectProbationTeam = (team: string) => this.getInputById('probationTeamCode').clear().type(team)

  selectMeetingType = (type: string) => this.getInputByLabel('Select meeting type').select(type)

  selectRadioFirstMeetingType = () => this.getInputById('meetingTypeCode').click()

  selectNoToProbationOfficerDetailsKnown = () => this.getInputById('probationOfficerDetailsKnown-2').click()
}
