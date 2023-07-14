import Page from '../../page'

export default class UploadPrisonerListPage extends Page {
  constructor() {
    super('appointments-create-upload-prisoner-list-page')
  }

  attatchFile = (filename: string) =>
    this.getInputByName('file').attachFile(`fileUpload/${filename}`, { allowEmpty: true })

  howToUseCSVSection = () => cy.contains('How to use a CSV file').click()

  uploadFile = () => cy.get('button').contains('Upload file').click()
}
