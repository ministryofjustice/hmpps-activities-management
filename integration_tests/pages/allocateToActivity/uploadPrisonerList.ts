import Page from '../page'

export default class UploadPrisonerListPage extends Page {
  constructor() {
    super('activities-allocate-multiple-upload-prisoner-list-page')
  }

  caption = (): Cypress.Chainable => cy.get('.govuk-caption-xl')

  attatchFile = (filename: string) =>
    this.getInputByName('file').attachFile(`fileUpload/${filename}`, { allowEmpty: true })

  howToUseCSVSection = () => cy.contains('How to use a CSV file').click()

  uploadFile = () => cy.get('button').contains('Upload file').click()

}
