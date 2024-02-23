import { addDays } from 'date-fns'
import Page from '../../pages/page'
import IndexPage from '../../pages'
import AppointmentsManagementPage from '../../pages/appointments/appointmentsManagementPage'
import SelectPrisonerPage from '../../pages/appointments/create-and-edit/selectPrisonerPage'
import NamePage from '../../pages/appointments/create-and-edit/namePage'
import LocationPage from '../../pages/appointments/create-and-edit/locationPage'
import getPrisonPrisonersA8644DY from '../../fixtures/prisonerSearchApi/getPrisonPrisoners-MDI-A8644DY.json'
import getPrisonerA8644DY from '../../fixtures/prisonerSearchApi/getPrisoner-MDI-A8644DY.json'
import getPrisonPrisonersA1350DZ from '../../fixtures/prisonerSearchApi/getPrisonPrisoners-MDI-A1350DZ.json'
import getPrisonerA1350DZ from '../../fixtures/prisonerSearchApi/getPrisoner-MDI-A1350DZ.json'
import getCategories from '../../fixtures/activitiesApi/getAppointmentCategories.json'
import getAppointmentLocations from '../../fixtures/prisonApi/getMdiAppointmentLocations.json'
import getScheduledEvents from '../../fixtures/activitiesApi/getScheduledEventsMdi20230202.json'
import getAppointmentSeries from '../../fixtures/activitiesApi/getAppointmentSeries.json'
import getAppointmentSeriesDetails from '../../fixtures/activitiesApi/getAppointmentSeriesDetails.json'
import getAppointmentDetails from '../../fixtures/activitiesApi/getAppointmentDetails.json'
import DateAndTimePage from '../../pages/appointments/create-and-edit/dateAndTimePage'
import RepeatPage from '../../pages/appointments/create-and-edit/repeatPage'
import CheckAnswersPage from '../../pages/appointments/create-and-edit/checkAnswersPage'
import ConfirmationPage from '../../pages/appointments/create-and-edit/confirmationPage'
import { formatDate } from '../../../server/utils/utils'
import ExtraInformationPage from '../../pages/appointments/create-and-edit/extraInformationPage'
import RepeatFrequencyAndCountPage from '../../pages/appointments/create-and-edit/repeatFrequencyAndCountPage'
import SchedulePage from '../../pages/appointments/create-and-edit/schedulePage'
import TierPage from '../../pages/appointments/create-and-edit/tierPage'
import HostPage from '../../pages/appointments/create-and-edit/hostPage'
import HowToAddPrisonersPage from '../../pages/appointments/create-and-edit/howToAddPrisonersPage'
import ReviewPrisonersPage from '../../pages/appointments/create-and-edit/reviewPrisonersPage'

context('Create group appointment - check answers change links', () => {
  const tomorrow = addDays(new Date(), 1)
  const tomorrowFormatted = formatDate(tomorrow, 'yyyy-MM-dd')
  const dayAfterTomorrow = addDays(new Date(), 2)
  const dayAfterTomorrowFormatted = formatDate(dayAfterTomorrow, 'yyyy-MM-dd')
  getAppointmentSeriesDetails.startDate = dayAfterTomorrowFormatted
  getAppointmentSeriesDetails.appointments[0].startDate = getAppointmentSeriesDetails.startDate
  getAppointmentDetails.startDate = getAppointmentSeriesDetails.startDate
  getAppointmentDetails.attendees[0].prisoner.firstName = 'DAVID'
  getAppointmentDetails.attendees[0].prisoner.lastName = 'WINCHURCH'
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

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.signIn()
    cy.stubEndpoint('GET', '/prison/MDI/prisoners\\?term=A8644DY&size=50', getPrisonPrisonersA8644DY)
    cy.stubEndpoint('GET', '/prisoner/A8644DY', getPrisonerA8644DY)
    cy.stubEndpoint('GET', '/prison/MDI/prisoners\\?term=A1350DZ&size=50', getPrisonPrisonersA1350DZ)
    cy.stubEndpoint('GET', '/prisoner/A1350DZ', getPrisonerA1350DZ)
    cy.stubEndpoint('GET', '/appointment-categories', getCategories)
    cy.stubEndpoint('GET', '/appointment-locations/MDI', getAppointmentLocations)
    cy.stubEndpoint('POST', `/scheduled-events/prison/MDI\\?date=${tomorrowFormatted}`, getScheduledEvents)
    cy.stubEndpoint('POST', `/scheduled-events/prison/MDI\\?date=${dayAfterTomorrowFormatted}`, getScheduledEvents)
    cy.stubEndpoint('POST', '/appointment-series', getAppointmentSeries)
    cy.stubEndpoint('GET', '/appointment-series/10/details', getAppointmentSeriesDetails)
    cy.stubEndpoint('GET', '/appointments/11/details', getAppointmentDetails)
  })

  it('Create group appointment - check answers change links', () => {
    // Move through the journey to check answers page
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.appointmentsManagementCard().click()

    Page.verifyOnPage(AppointmentsManagementPage)
    cy.visit('/appointments/create/start-group')

    const howToAddPrisonersPage = Page.verifyOnPage(HowToAddPrisonersPage)
    howToAddPrisonersPage.selectHowToAdd('Search for them one by one')
    howToAddPrisonersPage.continue()

    const selectPrisonerPage = Page.verifyOnPage(SelectPrisonerPage)
    selectPrisonerPage.enterPrisonerNumber('A8644DY')
    selectPrisonerPage.searchButton().click()

    Page.verifyOnPage(SelectPrisonerPage)
    selectPrisonerPage.continueButton().click()

    const reviewPrisonersPage = Page.verifyOnPage(ReviewPrisonersPage)
    reviewPrisonersPage.assertPrisonerInList('Gregs, Stephen')
    reviewPrisonersPage.continue()

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
    repeatPage.selectRepeat('No')
    repeatPage.continue()

    const schedulePage = Page.verifyOnPage(SchedulePage)
    schedulePage.continue()

    const extraInformationPage = Page.verifyOnPage(ExtraInformationPage)
    extraInformationPage.continue()

    // Verify initial answers
    const checkAnswersPage = Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage.assertPrisonerSummary('Gregs, Stephen', 'A8644DY', '1-3')
    checkAnswersPage.assertCategory('Chaplaincy')
    checkAnswersPage.assertLocation('Chapel')
    checkAnswersPage.assertStartDate(tomorrow)
    checkAnswersPage.assertStartTime(14, 0)
    checkAnswersPage.assertEndTime(15, 30)
    checkAnswersPage.assertRepeat('No')
    checkAnswersPage.assertExtraInformation('')

    // Change each answer
    checkAnswersPage.changePrisoners()

    Page.verifyOnPage(ReviewPrisonersPage)
    reviewPrisonersPage.assertPrisonerInList('Gregs, Stephen')
    reviewPrisonersPage.addAnotherPrisoner()

    Page.verifyOnPage(HowToAddPrisonersPage)
    howToAddPrisonersPage.selectHowToAdd('Search for them one by one')
    howToAddPrisonersPage.continue()

    Page.verifyOnPage(SelectPrisonerPage)
    selectPrisonerPage.enterPrisonerNumber('A1350DZ')
    selectPrisonerPage.searchButton().click()

    Page.verifyOnPage(SelectPrisonerPage)
    selectPrisonerPage.continueButton().click()

    Page.verifyOnPage(ReviewPrisonersPage)
    reviewPrisonersPage.assertPrisonerInList('Winchurch, David')
    reviewPrisonersPage.assertPrisonerInList('Gregs, Stephen')
    reviewPrisonersPage.continue()

    Page.verifyOnPage(SchedulePage)
    schedulePage.continue()

    checkAnswersPage.assertPrisonerSummary('Winchurch, David', 'A1350DZ', '2-2-024')

    checkAnswersPage.changeName()
    Page.verifyOnPage(NamePage)
    namePage.assertSelectedCategory('Chaplaincy')
    namePage.selectCategory('Gym - Weights')
    namePage.continue()
    checkAnswersPage.assertCategory('Gym - Weights')

    checkAnswersPage.changeLocation()
    Page.verifyOnPage(LocationPage)
    locationPage.assertSelectedLocation('Chapel')
    locationPage.selectLocation('Gym')
    locationPage.continue()
    checkAnswersPage.assertLocation('Gym')

    checkAnswersPage.changeStartDate()
    Page.verifyOnPage(DateAndTimePage)
    dateAndTimePage.assertStartDate(tomorrow)
    dateAndTimePage.selectStartDate(dayAfterTomorrow)
    dateAndTimePage.continue()
    Page.verifyOnPage(SchedulePage)
    schedulePage.continue()
    Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage.assertStartDate(dayAfterTomorrow)

    checkAnswersPage.changeStartTime()
    Page.verifyOnPage(DateAndTimePage)
    dateAndTimePage.assertStartTime(14, 0)
    dateAndTimePage.selectStartTime(15, 5)
    dateAndTimePage.continue()
    Page.verifyOnPage(SchedulePage)
    schedulePage.continue()
    Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage.assertStartTime(15, 5)

    checkAnswersPage.changeEndTime()
    Page.verifyOnPage(DateAndTimePage)
    dateAndTimePage.assertEndTime(15, 30)
    dateAndTimePage.selectEndTime(16, 15)
    dateAndTimePage.continue()
    Page.verifyOnPage(SchedulePage)
    schedulePage.continue()
    Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage.assertEndTime(16, 15)

    checkAnswersPage.changeRepeat()
    Page.verifyOnPage(RepeatPage)
    repeatPage.selectRepeat('Yes')
    repeatPage.continue()
    const repeatFrequencyAndCountPage = Page.verifyOnPage(RepeatFrequencyAndCountPage)
    repeatFrequencyAndCountPage.selectFrequency('Every weekday')
    repeatFrequencyAndCountPage.enterNumberOfAppointments('10')
    repeatFrequencyAndCountPage.continue()
    Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage.assertRepeat('Yes')
    checkAnswersPage.assertFrequency('Every weekday')
    checkAnswersPage.assertNumberOfAppointments('10')

    checkAnswersPage.changeExtraInformation()
    Page.verifyOnPage(ExtraInformationPage)
    extraInformationPage.enterExtraInformation('Appointment extra information')
    extraInformationPage.continue()
    checkAnswersPage.assertExtraInformation('Appointment extra information')

    checkAnswersPage.createAppointment()

    const confirmationPage = Page.verifyOnPage(ConfirmationPage)
    confirmationPage.assertMessageEquals(
      `You have successfully scheduled an appointment for 1 person on ${formatDate(
        dayAfterTomorrow,
        'EEEE, d MMMM yyyy',
      )}.`,
    )
  })
})
