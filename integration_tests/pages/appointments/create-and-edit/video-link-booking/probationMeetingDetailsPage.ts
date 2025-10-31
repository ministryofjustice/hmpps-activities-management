import Page from '../../../page'

export default class ProbationMeetingDetailsPage extends Page {
  constructor() {
    super('meeting-details-page')
  }

  selectProbationTeam = (team: string) => this.getInputById('probationTeamCode').clear().type(team)

  selectMeetingType = (type: string) => this.getInputByLabel('Select meeting type').select(type)

  selectRadioFirstMeetingType = () => cy.get('[type="radio"]').first().check()

  checkOfficerDetailsNotKnown = () => this.getInputByName('officerDetailsNotKnown').check()
}
