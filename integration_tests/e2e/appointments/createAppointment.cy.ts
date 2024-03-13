import { addDays } from 'date-fns'
import Page from '../../pages/page'
import IndexPage from '../../pages'
import AppointmentsManagementPage from '../../pages/appointments/appointmentsManagementPage'
import SelectPrisonerPage from '../../pages/appointments/create-and-edit/selectPrisonerPage'
import NamePage from '../../pages/appointments/create-and-edit/namePage'
import LocationPage from '../../pages/appointments/create-and-edit/locationPage'
import getPrisonPrisonersA1351DZ from '../../fixtures/prisonerSearchApi/getPrisonPrisoners-MDI-A1351DZ.json'
import getPrisonerA1351DZ from '../../fixtures/prisonerSearchApi/getPrisoner-MDI-A1351DZ.json'
import getPrisonPrisonersA8644DYA1351DZ from '../../fixtures/prisonerSearchApi/postPrisonerNumbers-A1350DZ-A8644DY.json'
import getCategories from '../../fixtures/activitiesApi/getAppointmentCategories.json'
import getAppointmentLocations from '../../fixtures/prisonApi/getMdiAppointmentLocations.json'
import getScheduledEvents from '../../fixtures/activitiesApi/getScheduledEventsMdi20230202.json'
import getAppointmentSeries from '../../fixtures/activitiesApi/getAppointmentSeries.json'
import getGroupAppointmentSeriesDetails from '../../fixtures/activitiesApi/getGroupAppointmentSeriesDetails.json'
import getGroupAppointmentDetails from '../../fixtures/activitiesApi/getGroupAppointmentDetails.json'
import getOffenderAlerts from '../../fixtures/activitiesApi/getOffenderAlerts.json'
import HowToAddPrisonersPage from '../../pages/appointments/create-and-edit/howToAddPrisonersPage'
import ReviewPrisonersPage from '../../pages/appointments/create-and-edit/reviewPrisonersPage'
import ReviewPrisonerAlertsPage, {
  arsonistBadge,
  catABadge,
  corruptorBadge,
  noOneToOneBadge,
  tactBadge,
} from '../../pages/appointments/create-and-edit/reviewPrisonerAlertsPage'
import DateAndTimePage from '../../pages/appointments/create-and-edit/dateAndTimePage'
import RepeatPage from '../../pages/appointments/create-and-edit/repeatPage'
import CheckAnswersPage from '../../pages/appointments/create-and-edit/checkAnswersPage'
import ConfirmationPage from '../../pages/appointments/create-and-edit/confirmationPage'
import { formatDate } from '../../../server/utils/utils'
import UploadPrisonerListPage from '../../pages/appointments/create-and-edit/uploadPrisonerListPage'
import AppointmentDetailsPage from '../../pages/appointments/appointment/appointmentDetailsPage'
import ExtraInformationPage from '../../pages/appointments/create-and-edit/extraInformationPage'
import SchedulePage from '../../pages/appointments/create-and-edit/schedulePage'
import TierPage from '../../pages/appointments/create-and-edit/tierPage'
import HostPage from '../../pages/appointments/create-and-edit/hostPage'

context('Create group appointment', () => {
  const tomorrow = addDays(new Date(), 1)
  const tomorrowFormatted = formatDate(tomorrow, 'yyyy-MM-dd')
  // To pass validation we must ensure the appointment details start date is set to tomorrow
  getGroupAppointmentSeriesDetails.startDate = tomorrowFormatted
  getGroupAppointmentSeriesDetails.appointments[0].startDate = getGroupAppointmentSeriesDetails.startDate
  getGroupAppointmentDetails.startDate = tomorrowFormatted
  getScheduledEvents.activities
    .filter(e => e.prisonerNumber === 'A7789DY')
    .forEach(e => {
      e.prisonerNumber = 'A1350DZ'
    })
  getScheduledEvents.activities
    .filter(e => e.prisonerNumber === 'G7218GI')
    .forEach(e => {
      e.prisonerNumber = 'A8644DY'
    })
  getScheduledEvents.activities
    .filter(e => e.prisonerNumber === 'G5897GP')
    .forEach(e => {
      e.prisonerNumber = 'A1351DZ'
    })

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.signIn()
    cy.stubEndpoint('GET', '/prison/MDI/prisoners\\?term=lee&size=50', getPrisonPrisonersA1351DZ)
    cy.stubEndpoint('GET', '/prisoner/A1351DZ', getPrisonerA1351DZ)
    cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', getPrisonPrisonersA8644DYA1351DZ)
    cy.stubEndpoint('GET', '/appointment-categories', getCategories)
    cy.stubEndpoint('GET', '/appointment-locations/MDI', getAppointmentLocations)
    cy.stubEndpoint('POST', `/scheduled-events/prison/MDI\\?date=${tomorrowFormatted}`, getScheduledEvents)
    cy.stubEndpoint('POST', '/appointment-series', getAppointmentSeries)
    cy.stubEndpoint('GET', '/appointment-series/10/details', getGroupAppointmentSeriesDetails)
    cy.stubEndpoint('GET', '/appointments/11/details', getGroupAppointmentDetails)
    cy.stubEndpoint('GET', '/users/jsmith', JSON.parse('{"name": "John Smith", "username": "jsmith"}'))
    cy.stubEndpoint('POST', '/api/bookings/offenderNo/MDI/alerts', getOffenderAlerts)
  })

  it('Should complete create group appointment journey', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.appointmentsManagementCard().should('contain.text', 'Appointments scheduling and attendance')
    indexPage
      .appointmentsManagementCard()
      .should(
        'contain.text',
        'Create, manage and edit appointments. Print movement slips. Record appointment attendance.',
      )
    indexPage.appointmentsManagementCard().click()

    const appointmentsManagementPage = Page.verifyOnPage(AppointmentsManagementPage)
    appointmentsManagementPage.createGroupAppointmentCard().should('contain.text', 'Schedule an appointment')
    appointmentsManagementPage
      .createGroupAppointmentCard()
      .should('contain.text', 'Set up a one-off or repeating appointment for one or more people.')
    appointmentsManagementPage.createGroupAppointmentCard().click()

    let howToAddPrisonersPage = Page.verifyOnPage(HowToAddPrisonersPage)
    howToAddPrisonersPage.selectHowToAdd('Add a group of people using a CSV file')
    howToAddPrisonersPage.continue()

    const uploadPrisonerListPage = Page.verifyOnPage(UploadPrisonerListPage)
    uploadPrisonerListPage.howToUseCSVSection()
    uploadPrisonerListPage.getLinkByText('prison number list template').click()
    uploadPrisonerListPage.assertFileDownload('prisoner-list.csv')
    uploadPrisonerListPage.attatchFile('upload-prisoner-list.csv')
    uploadPrisonerListPage.uploadFile()

    let reviewPrisonersPage = Page.verifyOnPage(ReviewPrisonersPage)
    reviewPrisonersPage.assertPrisonerInList('Gregs, Stephen')
    reviewPrisonersPage.assertPrisonerInList('Winchurch, David')
    reviewPrisonersPage.addAnotherPrisoner()
    reviewPrisonersPage.continue()

    howToAddPrisonersPage = Page.verifyOnPage(HowToAddPrisonersPage)
    howToAddPrisonersPage.selectHowToAdd('Search for them one by one')
    howToAddPrisonersPage.continue()

    let selectPrisonerPage = Page.verifyOnPage(SelectPrisonerPage)
    selectPrisonerPage.enterPrisonerNumber('lee')
    selectPrisonerPage.searchButton().click()

    selectPrisonerPage = Page.verifyOnPage(SelectPrisonerPage)
    selectPrisonerPage.continueButton().click()

    reviewPrisonersPage = Page.verifyOnPage(ReviewPrisonersPage)
    reviewPrisonersPage.assertPrisonerInList('Jacobson, Lee')
    reviewPrisonersPage.continue()

    const reviewPrisonerAlertsPage = Page.verifyOnPage(ReviewPrisonerAlertsPage)
    reviewPrisonerAlertsPage.assertPrisonerInList('Lee Jacobson')
    reviewPrisonerAlertsPage.assertBadges(arsonistBadge, catABadge, corruptorBadge, noOneToOneBadge, tactBadge)
    reviewPrisonerAlertsPage.assertAlertDescriptions(
      'Arsonist',
      'Corruptor',
      'No 1 to 1 with this prisoner',
      'Terrorism Act or Related Offence',
    )
    reviewPrisonerAlertsPage.continue()

    const namePage = Page.verifyOnPage(NamePage)
    namePage.selectCategory('Chaplaincy')
    namePage.continue()

    const tierPage = Page.verifyOnPage(TierPage)
    tierPage.selectTier('Tier 2')
    tierPage.continue()

    const hostPage = Page.verifyOnPage(HostPage)
    hostPage.selectHost('Prison staff')
    hostPage.continue()

    const locationPage = Page.verifyOnPage(LocationPage)
    locationPage.selectSearchForLocation()
    locationPage.selectLocation('Chapel')
    locationPage.continue()

    const dateAndTimePage = Page.verifyOnPage(DateAndTimePage)
    dateAndTimePage.selectStartDate(tomorrow)
    dateAndTimePage.selectStartTime(14, 0)
    dateAndTimePage.selectEndTime(15, 30)
    dateAndTimePage.continue()

    const repeatPage = Page.verifyOnPage(RepeatPage)
    repeatPage.selectRepeat('No')
    repeatPage.continue()

    const schedulePage = Page.verifyOnPage(SchedulePage)
    schedulePage.continue()

    const extraInformationPage = Page.verifyOnPage(ExtraInformationPage)
    extraInformationPage.continue()

    const checkAnswersPage = Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage.assertPrisonerInList('Winchurch, David', 'A1350DZ')
    checkAnswersPage.assertPrisonerInList('Gregs, Stephen', 'A8644DY')
    checkAnswersPage.assertPrisonerInList('Jacobson, Lee', 'A1351DZ')
    checkAnswersPage.assertCategory('Chaplaincy')
    checkAnswersPage.assertTier('Tier 2')
    checkAnswersPage.assertHost('Prison staff')
    checkAnswersPage.assertLocation('Chapel')
    checkAnswersPage.assertStartDate(tomorrow)
    checkAnswersPage.assertStartTime(14, 0)
    checkAnswersPage.assertEndTime(15, 30)
    checkAnswersPage.assertRepeat('No')
    checkAnswersPage.createAppointment()

    const confirmationPage = Page.verifyOnPage(ConfirmationPage)
    const successMessage = `You have successfully scheduled an appointment for 3 people on ${formatDate(
      tomorrow,
      'EEEE, d MMMM yyyy',
    )}.`
    confirmationPage.assertMessageEquals(successMessage)
    confirmationPage.assertCreateAnotherLinkExists()
    confirmationPage.assertViewAppointmentLinkExists()

    confirmationPage.viewAppointmentLink().click()

    const appointmentDetailsPage = Page.verifyOnPage(AppointmentDetailsPage)
    appointmentDetailsPage.assertNoAppointmentSeriesDetails()
    appointmentDetailsPage.assertName('Chaplaincy')
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
