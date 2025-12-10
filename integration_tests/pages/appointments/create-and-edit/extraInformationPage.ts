import Page from '../../page'

export default class ExtraInformationPage extends Page {
  constructor() {
    super('appointment-extra-information-page')
  }

  enterNotesForStaff = (extraInformation: string) =>
    this.getInputByName('extraInformation').clear().type(extraInformation)

  enterNotesForPrisoner = (extraInformation: string) =>
    this.getInputByName('prisonerExtraInformation').clear().type(extraInformation)

  // used by BVLS journeys only
  enterStaffNotes = (staffNotes: string) => this.getInputByName('notesForStaff').clear().type(staffNotes)

  // used by BVLS journeys only
  enterPrisonersNotes = (prisonersNotes: string) =>
    this.getInputByName('notesForPrisoners').clear().type(prisonersNotes)
}
