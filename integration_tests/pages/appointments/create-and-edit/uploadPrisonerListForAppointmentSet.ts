import Page from '../../page'

export default class UploadPrisonerListForAppointmentSet extends Page {
  constructor() {
    super('appointment-set-upload-page')
  }

  attachFile = (filename: string) =>
    this.getInputByName('file').attachFile(`fileUpload/${filename}`, { allowEmpty: true })

  howToUseCSVSection = () => cy.contains('How to use a CSV file').click()

  uploadFile = () => cy.get('button').contains('Upload file').click()
}
