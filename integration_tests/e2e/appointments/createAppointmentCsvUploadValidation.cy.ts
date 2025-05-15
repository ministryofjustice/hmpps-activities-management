import Page from '../../pages/page'
import postPrisonerNumbers from '../../fixtures/prisonerSearchApi/postPrisonerNumbers-A1350DZ-A8644DY.json'
import HowToAddPrisonersPage from '../../pages/appointments/create-and-edit/howToAddPrisonersPage'
import UploadPrisonerListPage from '../../pages/appointments/create-and-edit/uploadPrisonerListPage'
import UploadPrisonerListForAppointmentSet from '../../pages/appointments/create-and-edit/uploadPrisonerListForAppointmentSet'
import ReviewPrisonersPage from '../../pages/appointments/create-and-edit/reviewPrisonersPage'

context('Create group appointment - CSV upload validation - single appointment', () => {
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
    uploadPrisonerListPage.attachFile('larger-than-100kb.csv')
    uploadPrisonerListPage.uploadFile()

    cy.writeFile('integration_tests/fixtures/fileUpload/larger-than-100kb.csv', '')

    uploadPrisonerListPage.assertValidationError('file', 'The selected file must be smaller than 100kb')
  })

  it('Should fail validation when uploading an empty CSV file', () => {
    const howToAddPrisonersPage = Page.verifyOnPage(HowToAddPrisonersPage)
    howToAddPrisonersPage.selectGroup()
    howToAddPrisonersPage.continue()

    const uploadPrisonerListPage = Page.verifyOnPage(UploadPrisonerListPage)
    uploadPrisonerListPage.attachFile('empty-upload-prisoner-list.csv')
    uploadPrisonerListPage.uploadFile()

    uploadPrisonerListPage.assertValidationError('file', 'The selected file is empty')
  })

  it('Should fail validation when uploading a non CSV file', () => {
    const howToAddPrisonersPage = Page.verifyOnPage(HowToAddPrisonersPage)
    howToAddPrisonersPage.selectGroup()
    howToAddPrisonersPage.continue()

    const uploadPrisonerListPage = Page.verifyOnPage(UploadPrisonerListPage)
    uploadPrisonerListPage.attachFile('non-csv-file.xlsx')
    uploadPrisonerListPage.uploadFile()

    uploadPrisonerListPage.assertValidationError('file', 'You must upload a CSV file')
  })

  it('Should fail validation when uploading a non CSV file with the .csv extension', () => {
    const howToAddPrisonersPage = Page.verifyOnPage(HowToAddPrisonersPage)
    howToAddPrisonersPage.selectGroup()
    howToAddPrisonersPage.continue()

    const uploadPrisonerListPage = Page.verifyOnPage(UploadPrisonerListPage)
    uploadPrisonerListPage.attachFile('non-csv-file.csv')
    uploadPrisonerListPage.uploadFile()

    uploadPrisonerListPage.assertValidationError('file', 'You must upload a CSV file')
  })

  it('Should fail validation when CSV file does not contain any prisoner numbers', () => {
    const howToAddPrisonersPage = Page.verifyOnPage(HowToAddPrisonersPage)
    howToAddPrisonersPage.selectGroup()
    howToAddPrisonersPage.continue()

    const uploadPrisonerListPage = Page.verifyOnPage(UploadPrisonerListPage)
    uploadPrisonerListPage.attachFile('upload-prisoner-list-no-numbers.csv')
    uploadPrisonerListPage.uploadFile()

    uploadPrisonerListPage.assertValidationError('file', 'The selected file does not contain any prison numbers')
  })

  it('Should fail validation when one prisoner not found', () => {
    const howToAddPrisonersPage = Page.verifyOnPage(HowToAddPrisonersPage)
    howToAddPrisonersPage.selectGroup()
    howToAddPrisonersPage.continue()

    const uploadPrisonerListPage = Page.verifyOnPage(UploadPrisonerListPage)
    uploadPrisonerListPage.attachFile('upload-prisoner-list-one-not-found.csv')
    uploadPrisonerListPage.uploadFile()

    const reviewPrisonersPage = Page.verifyOnPage(ReviewPrisonersPage)
    reviewPrisonersPage.hasText('Some prison numbers in your CSV file could not be used')
    reviewPrisonersPage.list().should('contain.text', 'NOTFOUND')
  })

  it('Should fail validation when two prisoners not found', () => {
    const howToAddPrisonersPage = Page.verifyOnPage(HowToAddPrisonersPage)
    howToAddPrisonersPage.selectGroup()
    howToAddPrisonersPage.continue()

    const uploadPrisonerListPage = Page.verifyOnPage(UploadPrisonerListPage)
    uploadPrisonerListPage.attachFile('upload-prisoner-list-two-not-found.csv')
    uploadPrisonerListPage.uploadFile()

    const reviewPrisonersPage = Page.verifyOnPage(ReviewPrisonersPage)
    reviewPrisonersPage.hasText('Some prison numbers in your CSV file could not be used')
    reviewPrisonersPage.list().should('contain.text', 'NOTFOUND1')
    reviewPrisonersPage.list().should('contain.text', 'NOTFOUND2')
  })

  it('should filter out unidentified prisoner numbers - all prisoners missing', () => {
    cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers')
    const howToAddPrisonersPage = Page.verifyOnPage(HowToAddPrisonersPage)
    howToAddPrisonersPage.selectGroup()
    howToAddPrisonersPage.continue()

    const uploadPrisonerListPage = Page.verifyOnPage(UploadPrisonerListPage)
    uploadPrisonerListPage.attachFile('upload-prisoner-list-all-not-found.csv')
    uploadPrisonerListPage.uploadFile()

    const reviewPrisonersPage = Page.verifyOnPage(ReviewPrisonersPage)
    reviewPrisonersPage.missingPrisonersTitle().contains('No prison numbers in your CSV file could be used')
  })
})
context('Create group appointment - CSV upload validation - back-to-back appointments (set)', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', postPrisonerNumbers)
    cy.signIn()

    cy.visit('/appointments/create/start-set')
  })

  it('Should fail validation when no file is selected', () => {
    const uploadPrisonerListPage = Page.verifyOnPage(UploadPrisonerListForAppointmentSet)
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

    const uploadPrisonerListPage = Page.verifyOnPage(UploadPrisonerListForAppointmentSet)
    uploadPrisonerListPage.attachFile('larger-than-100kb.csv')
    uploadPrisonerListPage.uploadFile()

    cy.writeFile('integration_tests/fixtures/fileUpload/larger-than-100kb.csv', '')

    uploadPrisonerListPage.assertValidationError('file', 'The selected file must be smaller than 100kb')
  })

  it('Should fail validation when uploading an empty CSV file', () => {
    const uploadPrisonerListPage = Page.verifyOnPage(UploadPrisonerListForAppointmentSet)
    uploadPrisonerListPage.attachFile('empty-upload-prisoner-list.csv')
    uploadPrisonerListPage.uploadFile()

    uploadPrisonerListPage.assertValidationError('file', 'The selected file is empty')
  })

  it('Should fail validation when uploading a non CSV file', () => {
    const uploadPrisonerListPage = Page.verifyOnPage(UploadPrisonerListForAppointmentSet)
    uploadPrisonerListPage.attachFile('non-csv-file.xlsx')
    uploadPrisonerListPage.uploadFile()

    uploadPrisonerListPage.assertValidationError('file', 'You must upload a CSV file')
  })

  it('Should fail validation when uploading a non CSV file with the .csv extension', () => {
    const uploadPrisonerListPage = Page.verifyOnPage(UploadPrisonerListForAppointmentSet)
    uploadPrisonerListPage.attachFile('non-csv-file.csv')
    uploadPrisonerListPage.uploadFile()

    uploadPrisonerListPage.assertValidationError('file', 'You must upload a CSV file')
  })

  it('Should fail validation when CSV file does not contain any prisoner numbers', () => {
    const uploadPrisonerListPage = Page.verifyOnPage(UploadPrisonerListForAppointmentSet)
    uploadPrisonerListPage.attachFile('upload-prisoner-list-no-numbers.csv')
    uploadPrisonerListPage.uploadFile()

    uploadPrisonerListPage.assertValidationError('file', 'The selected file does not contain any prison numbers')
  })

  it('should filter out unidentified prisoner numbers - 1 prisoner missing', () => {
    const uploadPrisonerListPage = Page.verifyOnPage(UploadPrisonerListForAppointmentSet)
    uploadPrisonerListPage.attachFile('upload-prisoner-list-one-not-found-with-times.csv')
    uploadPrisonerListPage.uploadFile()

    const reviewPrisonersPage = Page.verifyOnPage(ReviewPrisonersPage)
    reviewPrisonersPage.assertPrisonerInList('Gregs, Stephen')
    reviewPrisonersPage.assertPrisonerInList('Winchurch, David')
    reviewPrisonersPage.missingPrisonersTitle().contains('Some prison numbers in your CSV file could not be used')
    reviewPrisonersPage.missingPrisonerList().contains('NOTFOUND')
  })

  it('should filter out unidentified prisoner numbers - 2 prisoners missing', () => {
    const uploadPrisonerListPage = Page.verifyOnPage(UploadPrisonerListForAppointmentSet)
    uploadPrisonerListPage.attachFile('upload-prisoner-list-two-not-found-with-times.csv')
    uploadPrisonerListPage.uploadFile()

    const reviewPrisonersPage = Page.verifyOnPage(ReviewPrisonersPage)
    reviewPrisonersPage.assertPrisonerInList('Gregs, Stephen')
    reviewPrisonersPage.assertPrisonerInList('Winchurch, David')
    reviewPrisonersPage.missingPrisonersTitle().contains('Some prison numbers in your CSV file could not be used')
    reviewPrisonersPage.missingPrisonerList().contains('NOTFOUND1')
    reviewPrisonersPage.missingPrisonerList().contains('NOTFOUND2')
  })

  it('should filter out unidentified prisoner numbers - all prisoners missing', () => {
    cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', [])
    const uploadPrisonerListPage = Page.verifyOnPage(UploadPrisonerListForAppointmentSet)
    uploadPrisonerListPage.attachFile('upload-prisoner-list-all-not-found-with-times.csv')
    uploadPrisonerListPage.uploadFile()

    const reviewPrisonersPage = Page.verifyOnPage(ReviewPrisonersPage)
    reviewPrisonersPage.missingPrisonersTitle().contains('No prison numbers in your CSV file could be used')
  })
})
