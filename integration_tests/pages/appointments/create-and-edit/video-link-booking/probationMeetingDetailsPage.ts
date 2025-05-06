import Page from '../../../page'

export default class ProbationMeetingDetailsPage extends Page {
  constructor() {
    super('meeting-details-page')
  }

  selectProbationTeam = (team: string) => this.getInputById('probationTeamCode').clear().type(team)

  selectFirstMeetingType = () => cy.get('[type="radio"]').first().check()

  checkOfficerDetailsNotKnown = () => this.getInputByName('officerDetailsNotKnown').check()
}
