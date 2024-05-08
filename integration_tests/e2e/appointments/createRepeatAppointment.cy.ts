import { addDays, addWeeks } from 'date-fns'
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
import getRepeatGroupAppointmentSeriesDetails from '../../fixtures/activitiesApi/getRepeatGroupAppointmentSeriesDetails.json'
import getRepeatGroupAppointment1Details from '../../fixtures/activitiesApi/getRepeatGroupAppointment1Details.json'
import HowToAddPrisonersPage from '../../pages/appointments/create-and-edit/howToAddPrisonersPage'
import RepeatFrequencyAndCountPage from '../../pages/appointments/create-and-edit/repeatFrequencyAndCountPage'
import ReviewPrisonersPage from '../../pages/appointments/create-and-edit/reviewPrisonersPage'
import DateAndTimePage from '../../pages/appointments/create-and-edit/dateAndTimePage'
import RepeatPage from '../../pages/appointments/create-and-edit/repeatPage'
import CheckAnswersPage from '../../pages/appointments/create-and-edit/checkAnswersPage'
import ConfirmationPage from '../../pages/appointments/create-and-edit/confirmationPage'
import { formatDate } from '../../../server/utils/utils'
import UploadPrisonerListPage from '../../pages/appointments/create-and-edit/uploadPrisonerListPage'
import AppointmentDetailsPage from '../../pages/appointments/appointment/appointmentDetailsPage'
import { AppointmentFrequency } from '../../../server/@types/appointments'
import ExtraInformationPage from '../../pages/appointments/create-and-edit/extraInformationPage'
import SchedulePage from '../../pages/appointments/create-and-edit/schedulePage'
import TierPage from '../../pages/appointments/create-and-edit/tierPage'
import HostPage from '../../pages/appointments/create-and-edit/hostPage'
import getOffenderAlerts from '../../fixtures/activitiesApi/getOffenderAlerts.json'
import ReviewPrisonerAlertsPage, {
  arsonistBadge,
  catABadge,
  corruptorBadge,
  noOneToOneBadge,
  tactBadge,
} from '../../pages/appointments/create-and-edit/reviewPrisonerAlertsPage'

context('Create group appointment', () => {
  const tomorrow = addDays(new Date(), 1)
  const tomorrowFormatted = formatDate(tomorrow, 'yyyy-MM-dd')
  const weekTomorrow = addWeeks(tomorrow, 1)
  const weekTomorrowFormatted = formatDate(weekTomorrow, 'yyyy-MM-dd')
  // To pass validation we must ensure the appointment details start date is set to tomorrow
  getRepeatGroupAppointmentSeriesDetails.startDate = tomorrowFormatted
  getRepeatGroupAppointmentSeriesDetails.schedule.frequency = AppointmentFrequency.DAILY
  getRepeatGroupAppointmentSeriesDetails.schedule.numberOfAppointments = 7
  getRepeatGroupAppointmentSeriesDetails.appointments[0].startDate = tomorrowFormatted
  getRepeatGroupAppointmentSeriesDetails.appointments[1].startDate = weekTomorrowFormatted
  getRepeatGroupAppointment1Details.startDate = tomorrowFormatted
  getRepeatGroupAppointment1Details.appointmentSeries.schedule.frequency = AppointmentFrequency.DAILY
  getRepeatGroupAppointment1Details.appointmentSeries.schedule.numberOfAppointments = 7
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
    cy.stubEndpoint('GET', '/appointment-series/10/details', getRepeatGroupAppointmentSeriesDetails)
    cy.stubEndpoint('GET', '/appointments/11/details', getRepeatGroupAppointment1Details)
    cy.stubEndpoint('GET', '/users/jsmith', JSON.parse('{"name": "John Smith", "username": "jsmith"}'))
    cy.stubEndpoint('POST', '/api/bookings/offenderNo/MDI/alerts?', getOffenderAlerts)
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

    const howToAddPrisonersPage = Page.verifyOnPage(HowToAddPrisonersPage)
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
    dateAndTimePage.enterStartDate(tomorrow)
    dateAndTimePage.selectStartTime(14, 0)
    dateAndTimePage.selectEndTime(15, 30)
    dateAndTimePage.continue()

    const repeatPage = Page.verifyOnPage(RepeatPage)
    repeatPage.selectRepeat('Yes')
    repeatPage.continue()

    const repeatFrequencyAndCountPage = Page.verifyOnPage(RepeatFrequencyAndCountPage)
    repeatFrequencyAndCountPage.selectFrequency('Daily (includes weekends)')
    repeatFrequencyAndCountPage.enterNumberOfAppointments('7')
    repeatFrequencyAndCountPage.continue()

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
    checkAnswersPage.assertRepeat('Yes')
    checkAnswersPage.assertFrequency('Daily (includes weekends)')
    checkAnswersPage.assertNumberOfAppointments('7')
    checkAnswersPage.createAppointment()

    const confirmationPage = Page.verifyOnPage(ConfirmationPage)
    const successMessage = `You have successfully scheduled an appointment for 3 people starting on ${formatDate(
      tomorrow,
      'EEEE, d MMMM yyyy',
    )}. It will repeat daily (includes weekends) for 7 appointments`
    confirmationPage.assertMessageEquals(successMessage)
    confirmationPage.assertCreateAnotherLinkExists()
    confirmationPage.assertViewAppointmentLinkExists()

    confirmationPage.viewAppointmentLink().click()

    const appointmentDetailsPage = Page.verifyOnPage(AppointmentDetailsPage)
    appointmentDetailsPage.assertPrisonerSummary('Gregs, Stephen', 'A8644DY', '1-3')
    appointmentDetailsPage.assertPrisonerSummary('Winchurch, David', 'A1350DZ', '2-2-024')
    appointmentDetailsPage.assertPrisonerSummary('Jacobson, Lee', 'A1351DZ', '1')
    appointmentDetailsPage.assertName('Chaplaincy')
    appointmentDetailsPage.assertLocation('Chapel')
    appointmentDetailsPage.assertStartDate(tomorrow)
    appointmentDetailsPage.assertStartTime(14, 0)
    appointmentDetailsPage.assertEndTime(15, 30)
    appointmentDetailsPage.assertCreatedBy('J. Smith')
    appointmentDetailsPage.assertPrintMovementSlipLink()

    appointmentDetailsPage.assertCreatedBy('J. Smith')
  })
})
