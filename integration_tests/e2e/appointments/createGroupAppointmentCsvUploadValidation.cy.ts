import Page from '../../pages/page'
import IndexPage from '../../pages'
import postPrisonerNumbers from '../../fixtures/prisonerSearchApi/postPrisonerNumbers-A1350DZ-A8644DY.json'
import AppointmentsManagementPage from '../../pages/appointments/appointmentsManagementPage'
import HowToAddPrisonersPage from '../../pages/appointments/create-and-edit/howToAddPrisonersPage'
import UploadPrisonerListPage from '../../pages/appointments/create-and-edit/uploadPrisonerListPage'

context('Create group appointment - CSV upload validation', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubPrisonUser')
    cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', postPrisonerNumbers)
    cy.signIn()
  })

  it('Should fail validation when no file is selected', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.appointmentsManagementCard().click()

    const appointmentsManagementPage = Page.verifyOnPage(AppointmentsManagementPage)
    appointmentsManagementPage.createGroupAppointmentCard().click()

    const howToAddPrisonersPage = Page.verifyOnPage(HowToAddPrisonersPage)
    howToAddPrisonersPage.selectHowToAdd('Upload a CSV file of prison numbers to add to the appointment list')
    howToAddPrisonersPage.continue()

    const uploadPrisonerListPage = Page.verifyOnPage(UploadPrisonerListPage)
    uploadPrisonerListPage.continue()

    uploadPrisonerListPage.assertValidationError('file', "Select a CSV file of prisoners' numbers")
  })

  it('Should fail validation when uploading CSV file larger than 100kb', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.appointmentsManagementCard().click()

    const appointmentsManagementPage = Page.verifyOnPage(AppointmentsManagementPage)
    appointmentsManagementPage.createGroupAppointmentCard().click()

    const howToAddPrisonersPage = Page.verifyOnPage(HowToAddPrisonersPage)
    howToAddPrisonersPage.selectHowToAdd('Upload a CSV file of prison numbers to add to the appointment list')
    howToAddPrisonersPage.continue()

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
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.appointmentsManagementCard().click()

    const appointmentsManagementPage = Page.verifyOnPage(AppointmentsManagementPage)
    appointmentsManagementPage.createGroupAppointmentCard().click()

    const howToAddPrisonersPage = Page.verifyOnPage(HowToAddPrisonersPage)
    howToAddPrisonersPage.selectHowToAdd('Upload a CSV file of prison numbers to add to the appointment list')
    howToAddPrisonersPage.continue()

    const uploadPrisonerListPage = Page.verifyOnPage(UploadPrisonerListPage)
    uploadPrisonerListPage.attatchFile('empty-upload-prisoner-list.csv')
    uploadPrisonerListPage.continue()

    uploadPrisonerListPage.assertValidationError('file', 'The selected file is empty')
  })

  it('Should fail validation when uploading a non CSV file', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.appointmentsManagementCard().click()

    const appointmentsManagementPage = Page.verifyOnPage(AppointmentsManagementPage)
    appointmentsManagementPage.createGroupAppointmentCard().click()

    const howToAddPrisonersPage = Page.verifyOnPage(HowToAddPrisonersPage)
    howToAddPrisonersPage.selectHowToAdd('Upload a CSV file of prison numbers to add to the appointment list')
    howToAddPrisonersPage.continue()

    const uploadPrisonerListPage = Page.verifyOnPage(UploadPrisonerListPage)
    uploadPrisonerListPage.attatchFile('non-csv-file.xlsx')
    uploadPrisonerListPage.continue()

    uploadPrisonerListPage.assertValidationError('file', 'The selected file must be a CSV')
  })

  it('Should fail validation when uploading a non CSV file with the .csv extension', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.appointmentsManagementCard().click()

    const appointmentsManagementPage = Page.verifyOnPage(AppointmentsManagementPage)
    appointmentsManagementPage.createGroupAppointmentCard().click()

    const howToAddPrisonersPage = Page.verifyOnPage(HowToAddPrisonersPage)
    howToAddPrisonersPage.selectHowToAdd('Upload a CSV file of prison numbers to add to the appointment list')
    howToAddPrisonersPage.continue()

    const uploadPrisonerListPage = Page.verifyOnPage(UploadPrisonerListPage)
    uploadPrisonerListPage.attatchFile('non-csv-file.csv')
    uploadPrisonerListPage.continue()

    uploadPrisonerListPage.assertValidationError('file', 'The selected file must be a CSV')
  })

  it('Should fail validation when CSV file does not contain any prisoner numbers', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.appointmentsManagementCard().click()

    const appointmentsManagementPage = Page.verifyOnPage(AppointmentsManagementPage)
    appointmentsManagementPage.createGroupAppointmentCard().click()

    const howToAddPrisonersPage = Page.verifyOnPage(HowToAddPrisonersPage)
    howToAddPrisonersPage.selectHowToAdd('Upload a CSV file of prison numbers to add to the appointment list')
    howToAddPrisonersPage.continue()

    const uploadPrisonerListPage = Page.verifyOnPage(UploadPrisonerListPage)
    uploadPrisonerListPage.attatchFile('upload-prisoner-list-no-numbers.csv')
    uploadPrisonerListPage.continue()

    uploadPrisonerListPage.assertValidationError('file', 'The selected file does not contain any prisoner numbers')
  })

  it('Should fail validation when one prisoner not found', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.appointmentsManagementCard().click()

    const appointmentsManagementPage = Page.verifyOnPage(AppointmentsManagementPage)
    appointmentsManagementPage.createGroupAppointmentCard().click()

    const howToAddPrisonersPage = Page.verifyOnPage(HowToAddPrisonersPage)
    howToAddPrisonersPage.selectHowToAdd('Upload a CSV file of prison numbers to add to the appointment list')
    howToAddPrisonersPage.continue()

    const uploadPrisonerListPage = Page.verifyOnPage(UploadPrisonerListPage)
    uploadPrisonerListPage.attatchFile('upload-prisoner-list-one-not-found.csv')
    uploadPrisonerListPage.continue()

    uploadPrisonerListPage.assertValidationError('file', 'Prisoner with number NOTFOUND was not found')
  })

  it('Should fail validation when two prisoners not found', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.appointmentsManagementCard().click()

    const appointmentsManagementPage = Page.verifyOnPage(AppointmentsManagementPage)
    appointmentsManagementPage.createGroupAppointmentCard().click()

    const howToAddPrisonersPage = Page.verifyOnPage(HowToAddPrisonersPage)
    howToAddPrisonersPage.selectHowToAdd('Upload a CSV file of prison numbers to add to the appointment list')
    howToAddPrisonersPage.continue()

    const uploadPrisonerListPage = Page.verifyOnPage(UploadPrisonerListPage)
    uploadPrisonerListPage.attatchFile('upload-prisoner-list-two-not-found.csv')
    uploadPrisonerListPage.continue()

    uploadPrisonerListPage.assertValidationError('file', 'Prisoners with numbers NOTFOUND1, NOTFOUND2 were not found')
  })
})
