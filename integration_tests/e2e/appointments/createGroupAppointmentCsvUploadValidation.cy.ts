import Page from '../../pages/page'
import postPrisonerNumbers from '../../fixtures/prisonerSearchApi/postPrisonerNumbers-A1350DZ-A8644DY.json'
import HowToAddPrisonersPage from '../../pages/appointments/create-and-edit/howToAddPrisonersPage'
import UploadPrisonerListPage from '../../pages/appointments/create-and-edit/uploadPrisonerListPage'
import UploadByCsvPage from '../../pages/appointments/create-and-edit/uploadbyCsvPage'

context('Create group appointment - CSV upload validation', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubPrisonUser')
    cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', postPrisonerNumbers)
    cy.signIn()

    cy.visit('/appointments/create/start-group')
  })

  it('Should fail validation when no file is selected', () => {
    const howToAddPrisonersPage = Page.verifyOnPage(HowToAddPrisonersPage)
    howToAddPrisonersPage.selectHowToAdd('Upload a CSV file of prison numbers to add to the list of attendees')
    howToAddPrisonersPage.continue()

    const uploadByCsvPage = Page.verifyOnPage(UploadByCsvPage)
    uploadByCsvPage.continue()

    const uploadPrisonerListPage = Page.verifyOnPage(UploadPrisonerListPage)
    uploadPrisonerListPage.continue()

    uploadPrisonerListPage.assertValidationError('file', "Select a CSV file of prisoners' numbers")
  })

  it('Should fail validation when uploading CSV file larger than 100kb', () => {
    const howToAddPrisonersPage = Page.verifyOnPage(HowToAddPrisonersPage)
    howToAddPrisonersPage.selectHowToAdd('Upload a CSV file of prison numbers to add to the list of attendees')
    howToAddPrisonersPage.continue()

    const uploadByCsvPage = Page.verifyOnPage(UploadByCsvPage)
    uploadByCsvPage.continue()

    const largerThan100kbData = ['Prison number']
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < 10000; i++) {
      largerThan100kbData.push('TESTDATA')
    }
    cy.writeFile('integration_tests/fixtures/fileUpload/larger-than-100kb.csv', largerThan100kbData.join('\r\n'))

    const uploadPrisonerListPage = Page.verifyOnPage(UploadPrisonerListPage)
    uploadPrisonerListPage.attatchFile('larger-than-100kb.csv')
    uploadPrisonerListPage.continue()

    cy.writeFile('integration_tests/fixtures/fileUpload/larger-than-100kb.csv', '')

    uploadPrisonerListPage.assertValidationError('file', 'The selected file must be smaller than 100kb')
  })

  it('Should fail validation when uploading an empty CSV file', () => {
    const howToAddPrisonersPage = Page.verifyOnPage(HowToAddPrisonersPage)
    howToAddPrisonersPage.selectHowToAdd('Upload a CSV file of prison numbers to add to the list of attendees')
    howToAddPrisonersPage.continue()

    const uploadByCsvPage = Page.verifyOnPage(UploadByCsvPage)
    uploadByCsvPage.continue()

    const uploadPrisonerListPage = Page.verifyOnPage(UploadPrisonerListPage)
    uploadPrisonerListPage.attatchFile('empty-upload-prisoner-list.csv')
    uploadPrisonerListPage.continue()

    uploadPrisonerListPage.assertValidationError('file', 'The selected file is empty')
  })

  it('Should fail validation when uploading a non CSV file', () => {
    const howToAddPrisonersPage = Page.verifyOnPage(HowToAddPrisonersPage)
    howToAddPrisonersPage.selectHowToAdd('Upload a CSV file of prison numbers to add to the list of attendees')
    howToAddPrisonersPage.continue()

    const uploadByCsvPage = Page.verifyOnPage(UploadByCsvPage)
    uploadByCsvPage.continue()

    const uploadPrisonerListPage = Page.verifyOnPage(UploadPrisonerListPage)
    uploadPrisonerListPage.attatchFile('non-csv-file.xlsx')
    uploadPrisonerListPage.continue()

    uploadPrisonerListPage.assertValidationError('file', 'The selected file must be a CSV')
  })

  it('Should fail validation when uploading a non CSV file with the .csv extension', () => {
    const howToAddPrisonersPage = Page.verifyOnPage(HowToAddPrisonersPage)
    howToAddPrisonersPage.selectHowToAdd('Upload a CSV file of prison numbers to add to the list of attendees')
    howToAddPrisonersPage.continue()

    const uploadByCsvPage = Page.verifyOnPage(UploadByCsvPage)
    uploadByCsvPage.continue()

    const uploadPrisonerListPage = Page.verifyOnPage(UploadPrisonerListPage)
    uploadPrisonerListPage.attatchFile('non-csv-file.csv')
    uploadPrisonerListPage.continue()

    uploadPrisonerListPage.assertValidationError('file', 'The selected file must be a CSV')
  })

  it('Should fail validation when CSV file does not contain any prisoner numbers', () => {
    const howToAddPrisonersPage = Page.verifyOnPage(HowToAddPrisonersPage)
    howToAddPrisonersPage.selectHowToAdd('Upload a CSV file of prison numbers to add to the list of attendees')
    howToAddPrisonersPage.continue()

    const uploadByCsvPage = Page.verifyOnPage(UploadByCsvPage)
    uploadByCsvPage.continue()

    const uploadPrisonerListPage = Page.verifyOnPage(UploadPrisonerListPage)
    uploadPrisonerListPage.attatchFile('upload-prisoner-list-no-numbers.csv')
    uploadPrisonerListPage.continue()

    uploadPrisonerListPage.assertValidationError('file', 'The selected file does not contain any prison numbers')
  })

  it('Should fail validation when one prisoner not found', () => {
    const howToAddPrisonersPage = Page.verifyOnPage(HowToAddPrisonersPage)
    howToAddPrisonersPage.selectHowToAdd('Upload a CSV file of prison numbers to add to the list of attendees')
    howToAddPrisonersPage.continue()

    const uploadByCsvPage = Page.verifyOnPage(UploadByCsvPage)
    uploadByCsvPage.continue()

    const uploadPrisonerListPage = Page.verifyOnPage(UploadPrisonerListPage)
    uploadPrisonerListPage.attatchFile('upload-prisoner-list-one-not-found.csv')
    uploadPrisonerListPage.continue()

    uploadPrisonerListPage.assertValidationError('file', 'Prisoner with number NOTFOUND was not found')
  })

  it('Should fail validation when two prisoners not found', () => {
    const howToAddPrisonersPage = Page.verifyOnPage(HowToAddPrisonersPage)
    howToAddPrisonersPage.selectHowToAdd('Upload a CSV file of prison numbers to add to the list of attendees')
    howToAddPrisonersPage.continue()

    const uploadByCsvPage = Page.verifyOnPage(UploadByCsvPage)
    uploadByCsvPage.continue()

    const uploadPrisonerListPage = Page.verifyOnPage(UploadPrisonerListPage)
    uploadPrisonerListPage.attatchFile('upload-prisoner-list-two-not-found.csv')
    uploadPrisonerListPage.continue()

    uploadPrisonerListPage.assertValidationError('file', 'Prisoners with numbers NOTFOUND1, NOTFOUND2 were not found')
  })
})
