import Page from '../../page'

export default class UploadPrisonerListPage extends Page {
  constructor() {
    super('appointments-create-upload-prisoner-list-page')
  }

  attatchFile = (filename: string) =>
    this.getInputByName('file').attachFile(`fileUpload/${filename}`, { allowEmpty: true })

  opencsvSection = () => cy.get('button').contains('Show all sections').click()

  selectHowToAdd = (option: string) => this.getInputByLabel(option).click()
}
