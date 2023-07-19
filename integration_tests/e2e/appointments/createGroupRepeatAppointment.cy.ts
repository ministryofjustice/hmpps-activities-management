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
import getAppointment from '../../fixtures/activitiesApi/getAppointment.json'
import getRepeatGroupAppointmentDetails from '../../fixtures/activitiesApi/getRepeatGroupAppointmentDetails.json'
import getRepeatGroupOccurrence1Details from '../../fixtures/activitiesApi/getRepeatGroupOccurrence1Details.json'
import HowToAddPrisonersPage from '../../pages/appointments/create-and-edit/howToAddPrisonersPage'
import RepeatPeriodAndCountPage from '../../pages/appointments/create-and-edit/repeatPeriodAndCountPage'
import ReviewPrisonersPage from '../../pages/appointments/create-and-edit/reviewPrisonersPage'
import DateAndTimePage from '../../pages/appointments/create-and-edit/dateAndTimePage'
import RepeatPage from '../../pages/appointments/create-and-edit/repeatPage'
import CheckAnswersPage from '../../pages/appointments/create-and-edit/checkAnswersPage'
import ConfirmationPage from '../../pages/appointments/create-and-edit/confirmationPage'
import { formatDate } from '../../../server/utils/utils'
import UploadPrisonerListPage from '../../pages/appointments/create-and-edit/uploadPrisonerListPage'
import OccurrenceDetailsPage from '../../pages/appointments/occurrenceDetails/occurrenceDetails'
import { AppointmentRepeatPeriod } from '../../../server/@types/appointments'
import CommentPage from '../../pages/appointments/create-and-edit/commentPage'
import SchedulePage from '../../pages/appointments/create-and-edit/schedulePage'

context('Create group appointment', () => {
  const tomorrow = addDays(new Date(), 1)
  const tomorrowFormatted = formatDate(tomorrow, 'yyyy-MM-dd')
  const weekTomorrow = addWeeks(tomorrow, 1)
  const weekTomorrowFormatted = formatDate(weekTomorrow, 'yyyy-MM-dd')
  // To pass validation we must ensure the appointment details start date is set to tomorrow
  getRepeatGroupAppointmentDetails.startDate = tomorrowFormatted
  getRepeatGroupAppointmentDetails.repeat.period = AppointmentRepeatPeriod.DAILY
  getRepeatGroupAppointmentDetails.repeat.count = 7
  getRepeatGroupAppointmentDetails.occurrences[0].startDate = tomorrowFormatted
  getRepeatGroupAppointmentDetails.occurrences[1].startDate = weekTomorrowFormatted
  getRepeatGroupOccurrence1Details.startDate = weekTomorrowFormatted
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
    cy.stubEndpoint('POST', '/appointments', getAppointment)
    cy.stubEndpoint('GET', '/appointment-details/10', getRepeatGroupAppointmentDetails)
    cy.stubEndpoint('GET', '/appointment-occurrence-details/11', getRepeatGroupOccurrence1Details)
  })

  it('Should complete create group appointment journey', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.appointmentsManagementCard().should('contain.text', 'Schedule and edit appointments')
    indexPage
      .appointmentsManagementCard()
      .should(
        'contain.text',
        'Create one-to-one and group appointments. Edit existing appointments and print movement slips.',
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

    const namePage = Page.verifyOnPage(NamePage)
    namePage.selectCategory('Chaplaincy')
    namePage.continue()

    const locationPage = Page.verifyOnPage(LocationPage)
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

    const repeatPeriodAndCountPage = Page.verifyOnPage(RepeatPeriodAndCountPage)
    repeatPeriodAndCountPage.selectRepeatPeriod('Daily (includes weekends)')
    repeatPeriodAndCountPage.enterRepeatCount('7')
    repeatPeriodAndCountPage.continue()

    const schedulePage = Page.verifyOnPage(SchedulePage)
    schedulePage.continue()

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
    checkAnswersPage.assertRepeat('Yes')
    checkAnswersPage.assertRepeatPeriod('Daily (includes weekends)')
    checkAnswersPage.assertRepeatCount('7')
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

    const occurrenceDetailsPage = Page.verifyOnPage(OccurrenceDetailsPage)
    occurrenceDetailsPage.assertPrisonerSummary('Gregs, Stephen', 'A8644DY', '1-3')
    occurrenceDetailsPage.assertPrisonerSummary('Winchurch, David', 'A1350DZ', '2-2-024')
    occurrenceDetailsPage.assertPrisonerSummary('Jacobson, Lee', 'A1351DZ', '1')
    occurrenceDetailsPage.assertCategory('Chaplaincy')
    occurrenceDetailsPage.assertLocation('Chapel')
    occurrenceDetailsPage.assertStartDate(weekTomorrow)
    occurrenceDetailsPage.assertStartTime(14, 0)
    occurrenceDetailsPage.assertEndTime(15, 30)
    occurrenceDetailsPage.assertCreatedBy('J. Smith')
    occurrenceDetailsPage.assertPrintMovementSlipLink()

    occurrenceDetailsPage.assertCreatedBy('J. Smith')
  })
})
