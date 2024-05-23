import Page from '../../pages/page'
import postPrisonerNumbers from '../../fixtures/prisonerSearchApi/postPrisonerNumbers-A1350DZ-A8644DY.json'
import HowToAddPrisonersPage from '../../pages/appointments/create-and-edit/howToAddPrisonersPage'
import UploadPrisonerListPage from '../../pages/appointments/create-and-edit/uploadPrisonerListPage'

context('Create group appointment - CSV upload validation', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', postPrisonerNumbers)
    cy.signIn()

    cy.visit('/appointments/create/start-group')
  })

  it('Should fail validation when no file is selected', () => {
    const howToAddPrisonersPage = Page.verifyOnPage(HowToAddPrisonersPage)
    howToAddPrisonersPage.selectGroup()
    howToAddPrisonersPage.continue()

    const uploadPrisonerListPage = Page.verifyOnPage(UploadPrisonerListPage)
    uploadPrisonerListPage.uploadFile()

    uploadPrisonerListPage.assertValidationError('file', 'You must select a file')
  })

  it('Should fail validation when uploading CSV file larger than 100kb', () => {
    const largerThan100kbData = ['Prison number']
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < 10000; i++) {
      largerThan100kbData.push('TESTDATA')
    }
    cy.writeFile('integration_tests/fixtures/fileUpload/larger-than-100kb.csv', largerThan100kbData.join('\r\n'))

    const howToAddPrisonersPage = Page.verifyOnPage(HowToAddPrisonersPage)
    howToAddPrisonersPage.selectGroup()
    howToAddPrisonersPage.continue()

    const uploadPrisonerListPage = Page.verifyOnPage(UploadPrisonerListPage)
    uploadPrisonerListPage.attatchFile('larger-than-100kb.csv')
    uploadPrisonerListPage.uploadFile()

    cy.writeFile('integration_tests/fixtures/fileUpload/larger-than-100kb.csv', '')

    uploadPrisonerListPage.assertValidationError('file', 'The selected file must be smaller than 100kb')
  })

  it('Should fail validation when uploading an empty CSV file', () => {
    const howToAddPrisonersPage = Page.verifyOnPage(HowToAddPrisonersPage)
    howToAddPrisonersPage.selectGroup()
    howToAddPrisonersPage.continue()

    const uploadPrisonerListPage = Page.verifyOnPage(UploadPrisonerListPage)
    uploadPrisonerListPage.attatchFile('empty-upload-prisoner-list.csv')
    uploadPrisonerListPage.uploadFile()

    uploadPrisonerListPage.assertValidationError('file', 'The selected file is empty')
  })

  it('Should fail validation when uploading a non CSV file', () => {
    const howToAddPrisonersPage = Page.verifyOnPage(HowToAddPrisonersPage)
    howToAddPrisonersPage.selectGroup()
    howToAddPrisonersPage.continue()

    const uploadPrisonerListPage = Page.verifyOnPage(UploadPrisonerListPage)
    uploadPrisonerListPage.attatchFile('non-csv-file.xlsx')
    uploadPrisonerListPage.uploadFile()

    uploadPrisonerListPage.assertValidationError('file', 'You must upload a CSV file')
  })

  it('Should fail validation when uploading a non CSV file with the .csv extension', () => {
    const howToAddPrisonersPage = Page.verifyOnPage(HowToAddPrisonersPage)
    howToAddPrisonersPage.selectGroup()
    howToAddPrisonersPage.continue()

    const uploadPrisonerListPage = Page.verifyOnPage(UploadPrisonerListPage)
    uploadPrisonerListPage.attatchFile('non-csv-file.csv')
    uploadPrisonerListPage.uploadFile()

    uploadPrisonerListPage.assertValidationError('file', 'You must upload a CSV file')
  })

  it('Should fail validation when CSV file does not contain any prisoner numbers', () => {
    const howToAddPrisonersPage = Page.verifyOnPage(HowToAddPrisonersPage)
    howToAddPrisonersPage.selectGroup()
    howToAddPrisonersPage.continue()

    const uploadPrisonerListPage = Page.verifyOnPage(UploadPrisonerListPage)
    uploadPrisonerListPage.attatchFile('upload-prisoner-list-no-numbers.csv')
    uploadPrisonerListPage.uploadFile()

    uploadPrisonerListPage.assertValidationError('file', 'The selected file does not contain any prison numbers')
  })

  it('Should fail validation when one prisoner not found', () => {
    const howToAddPrisonersPage = Page.verifyOnPage(HowToAddPrisonersPage)
    howToAddPrisonersPage.selectGroup()
    howToAddPrisonersPage.continue()

    const uploadPrisonerListPage = Page.verifyOnPage(UploadPrisonerListPage)
    uploadPrisonerListPage.attatchFile('upload-prisoner-list-one-not-found.csv')
    uploadPrisonerListPage.uploadFile()

    uploadPrisonerListPage.assertValidationError('file', "The prison number 'NOTFOUND' was not recognised")
  })

  it('Should fail validation when two prisoners not found', () => {
    const howToAddPrisonersPage = Page.verifyOnPage(HowToAddPrisonersPage)
    howToAddPrisonersPage.selectGroup()
    howToAddPrisonersPage.continue()

    const uploadPrisonerListPage = Page.verifyOnPage(UploadPrisonerListPage)
    uploadPrisonerListPage.attatchFile('upload-prisoner-list-two-not-found.csv')
    uploadPrisonerListPage.uploadFile()

    uploadPrisonerListPage.assertValidationError(
      'file',
      "The following prison numbers 'NOTFOUND1', 'NOTFOUND2' were not recognised",
    )
  })
})
