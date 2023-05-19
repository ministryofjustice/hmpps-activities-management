import { addDays } from 'date-fns'
import Page from '../../pages/page'
import IndexPage from '../../pages'
import AppointmentsManagementPage from '../../pages/appointments/appointmentsManagementPage'
import SelectPrisonerPage from '../../pages/appointments/create-and-edit/selectPrisonerPage'
import CategoryPage from '../../pages/appointments/create-and-edit/categoryPage'
import DescriptionPage from '../../pages/appointments/create-and-edit/descriptionPage'
import LocationPage from '../../pages/appointments/create-and-edit/locationPage'
import getPrisonPrisonersA1351DZ from '../../fixtures/prisonerSearchApi/getPrisonPrisoners-MDI-A1351DZ.json'
import getPrisonerA1351DZ from '../../fixtures/prisonerSearchApi/getPrisoner-MDI-A1351DZ.json'
import getPrisonPrisonersA8644DYA1351DZ from '../../fixtures/prisonerSearchApi/postPrisonerNumbers-A1350DZ-A8644DY.json'
import getCategories from '../../fixtures/activitiesApi/getAppointmentCategories.json'
import getAppointmentLocations from '../../fixtures/prisonApi/getMdiAppointmentLocations.json'
import getAppointment from '../../fixtures/activitiesApi/getAppointment.json'
import getGroupAppointmentDetails from '../../fixtures/activitiesApi/getGroupAppointmentDetails.json'
import getGroupOccurrenceDetails from '../../fixtures/activitiesApi/getGroupOccurrenceDetails.json'
import HowToAddPrisonersPage from '../../pages/appointments/create-and-edit/howToAddPrisonersPage'
import ReviewPrisonersPage from '../../pages/appointments/create-and-edit/reviewPrisonersPage'
import DateAndTimePage from '../../pages/appointments/create-and-edit/dateAndTimePage'
import RepeatPage from '../../pages/appointments/create-and-edit/repeatPage'
import CheckAnswersPage from '../../pages/appointments/create-and-edit/checkAnswersPage'
import ConfirmationPage from '../../pages/appointments/create-and-edit/confirmationPage'
import { formatDate } from '../../../server/utils/utils'
import UploadPrisonerListPage from '../../pages/appointments/create-and-edit/uploadPrisonerListPage'
import UploadByCsvPage from '../../pages/appointments/create-and-edit/uploadbyCsvPage'
import OccurrenceDetailsPage from '../../pages/appointments/occurrenceDetails/occurrenceDetails'
import CommentPage from '../../pages/appointments/create-and-edit/commentPage'

context('Create group appointment', () => {
  const tomorrow = addDays(new Date(), 1)
  // To pass validation we must ensure the appointment details start date are set to tomorrow
  getGroupAppointmentDetails.startDate = formatDate(tomorrow, 'yyyy-MM-dd')
  getGroupAppointmentDetails.occurrences[0].startDate = getGroupAppointmentDetails.startDate
  getGroupOccurrenceDetails.startDate = formatDate(tomorrow, 'yyyy-MM-dd')

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubPrisonUser')
    cy.signIn()
    cy.stubEndpoint('GET', '/prison/MDI/prisoners\\?term=lee', getPrisonPrisonersA1351DZ)
    cy.stubEndpoint('GET', '/prisoner/A1351DZ', getPrisonerA1351DZ)
    cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', getPrisonPrisonersA8644DYA1351DZ)
    cy.stubEndpoint('GET', '/appointment-categories', getCategories)
    cy.stubEndpoint('GET', '/appointment-locations/MDI', getAppointmentLocations)
    cy.stubEndpoint('POST', '/appointments', getAppointment)
    cy.stubEndpoint('GET', '/appointment-details/10', getGroupAppointmentDetails)
    cy.stubEndpoint('GET', '/appointment-occurrence-details/11', getGroupOccurrenceDetails)
  })

  it('Should complete create group appointment journey', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.appointmentsManagementCard().should('contain.text', 'Appointments management')
    indexPage
      .appointmentsManagementCard()
      .should('contain.text', 'Create and manage appointments for individuals and groups.')
    indexPage.appointmentsManagementCard().click()

    const appointmentsManagementPage = Page.verifyOnPage(AppointmentsManagementPage)
    appointmentsManagementPage.createGroupAppointmentCard().should('contain.text', 'Create a group appointment')
    appointmentsManagementPage
      .createGroupAppointmentCard()
      .should('contain.text', 'Add a one-off or repeat appointment for a group of people.')
    appointmentsManagementPage.createGroupAppointmentCard().click()

    let howToAddPrisonersPage = Page.verifyOnPage(HowToAddPrisonersPage)
    howToAddPrisonersPage.selectHowToAdd('Upload a CSV file of prison numbers to add to the appointment list')
    howToAddPrisonersPage.continue()

    const uploadByCsvPage = Page.verifyOnPage(UploadByCsvPage)
    uploadByCsvPage.getLinkByText('Download CSV file template').click()
    uploadByCsvPage.assertFileDownload('prisoner-list.csv')
    uploadByCsvPage.continue()

    const uploadPrisonerListPage = Page.verifyOnPage(UploadPrisonerListPage)
    uploadPrisonerListPage.attatchFile('upload-prisoner-list.csv')
    uploadPrisonerListPage.continue()

    let reviewPrisonersPage = Page.verifyOnPage(ReviewPrisonersPage)
    reviewPrisonersPage.assertPrisonerInList('Gregs, Stephen')
    reviewPrisonersPage.assertPrisonerInList('Winchurch, David')
    reviewPrisonersPage.addAnotherPrisoner()
    reviewPrisonersPage.continue()

    howToAddPrisonersPage = Page.verifyOnPage(HowToAddPrisonersPage)
    howToAddPrisonersPage.selectHowToAdd('Search for a prison number to add to the appointment list')
    howToAddPrisonersPage.continue()

    let selectPrisonerPage = Page.verifyOnPage(SelectPrisonerPage)
    selectPrisonerPage.enterPrisonerNumber('lee')
    selectPrisonerPage.searchButton().click()

    selectPrisonerPage = Page.verifyOnPage(SelectPrisonerPage)
    selectPrisonerPage.continueButton().click()

    reviewPrisonersPage = Page.verifyOnPage(ReviewPrisonersPage)
    reviewPrisonersPage.assertPrisonerInList('Jacobson, Lee')
    reviewPrisonersPage.continue()

    const categoryPage = Page.verifyOnPage(CategoryPage)
    categoryPage.selectCategory('Chaplaincy')
    categoryPage.continue()

    const descriptionPage = Page.verifyOnPage(DescriptionPage)
    descriptionPage.descriptionOption('Yes')
    descriptionPage.continue()

    const locationPage = Page.verifyOnPage(LocationPage)
    locationPage.selectLocation('Chapel')
    locationPage.continue()

    const dateAndTimePage = Page.verifyOnPage(DateAndTimePage)
    dateAndTimePage.enterStartDate(tomorrow)
    dateAndTimePage.selectStartTime(14, 0)
    dateAndTimePage.selectEndTime(15, 30)
    dateAndTimePage.continue()

    const repeatPage = Page.verifyOnPage(RepeatPage)
    repeatPage.selectRepeat('No')
    repeatPage.continue()

    const commentPage = Page.verifyOnPage(CommentPage)
    commentPage.continue()

    const checkAnswersPage = Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage.assertPrisonerInList('Winchurch, David', 'A1350DZ')
    checkAnswersPage.assertPrisonerInList('Gregs, Stephen', 'A8644DY')
    checkAnswersPage.assertPrisonerInList('Jacobson, Lee', 'A1351DZ')
    checkAnswersPage.assertCategory('Chaplaincy')
    checkAnswersPage.assertLocation('Chapel')
    checkAnswersPage.assertStartDate(tomorrow)
    checkAnswersPage.assertStartTime(14, 0)
    checkAnswersPage.assertEndTime(15, 30)
    checkAnswersPage.assertRepeat('No')
    checkAnswersPage.createAppointment()

    const confirmationPage = Page.verifyOnPage(ConfirmationPage)
    const successMessage = `You have successfully created an appointment for 3 prisoners on ${formatDate(
      tomorrow,
      'EEEE, d MMMM yyyy',
    )}.`
    confirmationPage.assertMessageEquals(successMessage)
    confirmationPage.assertCreateAnotherLinkExists()
    confirmationPage.assertViewAppointmentLinkExists()

    confirmationPage.viewAppointmentLink().click()

    const appointmentDetailsPage = Page.verifyOnPage(OccurrenceDetailsPage)
    appointmentDetailsPage.assertNoAppointmentSeriesDetails()
    appointmentDetailsPage.assertCategory('Chaplaincy')
    appointmentDetailsPage.assertLocation('Chapel')
    appointmentDetailsPage.assertStartDate(tomorrow)
    appointmentDetailsPage.assertStartTime(14, 0)
    appointmentDetailsPage.assertEndTime(15, 30)
    appointmentDetailsPage.assertPrisonerSummary('Gregs, Stephen', 'A8644DY', '1-3')
    appointmentDetailsPage.assertPrisonerSummary('Winchurch, David', 'A1350DZ', '2-2-024')
    appointmentDetailsPage.assertPrisonerSummary('Jacobson, Lee', 'A1351DZ', '1')

    appointmentDetailsPage.assertCreatedBy('J. Smith')
  })
})
