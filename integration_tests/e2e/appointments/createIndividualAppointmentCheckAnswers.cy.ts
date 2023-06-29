import { addDays } from 'date-fns'
import Page from '../../pages/page'
import IndexPage from '../../pages'
import AppointmentsManagementPage from '../../pages/appointments/appointmentsManagementPage'
import SelectPrisonerPage from '../../pages/appointments/create-and-edit/selectPrisonerPage'
import CategoryPage from '../../pages/appointments/create-and-edit/categoryPage'
import LocationPage from '../../pages/appointments/create-and-edit/locationPage'
import getPrisonPrisonersA8644DY from '../../fixtures/prisonerSearchApi/getPrisonPrisoners-MDI-A8644DY.json'
import getPrisonerA8644DY from '../../fixtures/prisonerSearchApi/getPrisoner-MDI-A8644DY.json'
import getPrisonPrisonersA1350DZ from '../../fixtures/prisonerSearchApi/getPrisonPrisoners-MDI-A1350DZ.json'
import getPrisonerA1350DZ from '../../fixtures/prisonerSearchApi/getPrisoner-MDI-A1350DZ.json'
import getCategories from '../../fixtures/activitiesApi/getAppointmentCategories.json'
import getAppointmentLocations from '../../fixtures/prisonApi/getMdiAppointmentLocations.json'
import getScheduledEvents from '../../fixtures/activitiesApi/getScheduledEventsMdi20230202.json'
import getAppointment from '../../fixtures/activitiesApi/getAppointment.json'
import getAppointmentDetails from '../../fixtures/activitiesApi/getAppointmentDetails.json'
import DateAndTimePage from '../../pages/appointments/create-and-edit/dateAndTimePage'
import RepeatPage from '../../pages/appointments/create-and-edit/repeatPage'
import CheckAnswersPage from '../../pages/appointments/create-and-edit/checkAnswersPage'
import ConfirmationPage from '../../pages/appointments/create-and-edit/confirmationPage'
import { formatDate } from '../../../server/utils/utils'
import DescriptionPage from '../../pages/appointments/create-and-edit/descriptionPage'
import CommentPage from '../../pages/appointments/create-and-edit/commentPage'
import RepeatPeriodAndCountPage from '../../pages/appointments/create-and-edit/repeatPeriodAndCountPage'
import SchedulePage from '../../pages/appointments/create-and-edit/schedulePage'

context('Create individual appointment - check answers change links', () => {
  const tomorrow = addDays(new Date(), 1)
  const tomorrowFormatted = formatDate(tomorrow, 'yyyy-MM-dd')
  const dayAfterTomorrow = addDays(new Date(), 2)
  const dayAfterTomorrowFormatted = formatDate(dayAfterTomorrow, 'yyyy-MM-dd')
  getAppointmentDetails.startDate = dayAfterTomorrowFormatted
  getAppointmentDetails.occurrences[0].startDate = getAppointmentDetails.startDate
  getAppointmentDetails.prisoners[0].firstName = 'DAVID'
  getAppointmentDetails.prisoners[0].lastName = 'WINCHURCH'
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
    cy.stubEndpoint('GET', '/prison/MDI/prisoners\\?term=A8644DY', getPrisonPrisonersA8644DY)
    cy.stubEndpoint('GET', '/prisoner/A8644DY', getPrisonerA8644DY)
    cy.stubEndpoint('GET', '/prison/MDI/prisoners\\?term=A1350DZ', getPrisonPrisonersA1350DZ)
    cy.stubEndpoint('GET', '/prisoner/A1350DZ', getPrisonerA1350DZ)
    cy.stubEndpoint('GET', '/appointment-categories', getCategories)
    cy.stubEndpoint('GET', '/appointment-locations/MDI', getAppointmentLocations)
    cy.stubEndpoint('POST', `/scheduled-events/prison/MDI\\?date=${tomorrowFormatted}`, getScheduledEvents)
    cy.stubEndpoint('POST', `/scheduled-events/prison/MDI\\?date=${dayAfterTomorrowFormatted}`, getScheduledEvents)
    cy.stubEndpoint('POST', '/appointments', getAppointment)
    cy.stubEndpoint('GET', '/appointment-details/10', getAppointmentDetails)
  })

  it('Create individual appointment - check answers change links', () => {
    // Move through the journey to check answers page
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.appointmentsManagementCard().click()

    const appointmentsManagementPage = Page.verifyOnPage(AppointmentsManagementPage)
    appointmentsManagementPage.createIndividualAppointmentCard().click()

    const selectPrisonerPage = Page.verifyOnPage(SelectPrisonerPage)
    selectPrisonerPage.enterPrisonerNumber('A8644DY')
    selectPrisonerPage.searchButton().click()

    Page.verifyOnPage(SelectPrisonerPage)
    selectPrisonerPage.continueButton().click()

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

    const schedulePage = Page.verifyOnPage(SchedulePage)
    schedulePage.continue()

    const commentPage = Page.verifyOnPage(CommentPage)
    commentPage.continue()

    // Verify initial answers
    const checkAnswersPage = Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage.assertPrisonerSummary('Stephen Gregs', 'A8644DY', '1-3')
    checkAnswersPage.assertCategory('Chaplaincy')
    checkAnswersPage.assertLocation('Chapel')
    checkAnswersPage.assertStartDate(tomorrow)
    checkAnswersPage.assertStartTime(14, 0)
    checkAnswersPage.assertEndTime(15, 30)
    checkAnswersPage.assertRepeat('No')
    checkAnswersPage.assertComment('')

    // Change each answer
    checkAnswersPage.changePrisoner()
    Page.verifyOnPage(SelectPrisonerPage)
    selectPrisonerPage.assertEnteredPrisonerNumber('A8644DY')
    selectPrisonerPage.enterPrisonerNumber('A1350DZ')
    selectPrisonerPage.searchButton().click()

    Page.verifyOnPage(SelectPrisonerPage)
    selectPrisonerPage.continueButton().click()

    Page.verifyOnPage(SchedulePage)
    schedulePage.continue()

    checkAnswersPage.assertPrisonerSummary('David Winchurch', 'A1350DZ', '2-2-024')

    checkAnswersPage.changeCategory()
    Page.verifyOnPage(CategoryPage)
    categoryPage.assertSelectedCategory('Chaplaincy')
    categoryPage.selectCategory('Gym - Weights')
    categoryPage.continue()
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
    dateAndTimePage.enterStartDate(dayAfterTomorrow)
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
    const repeatPeriodAndCountPage = Page.verifyOnPage(RepeatPeriodAndCountPage)
    repeatPeriodAndCountPage.selectRepeatPeriod('Every weekday')
    repeatPeriodAndCountPage.enterRepeatCount('10')
    repeatPeriodAndCountPage.continue()
    Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage.assertRepeat('Yes')
    checkAnswersPage.assertRepeatPeriod('Every weekday')
    checkAnswersPage.assertRepeatCount('10')

    checkAnswersPage.changeComment()
    Page.verifyOnPage(CommentPage)
    commentPage.enterComment('Appointment level comment')
    commentPage.continue()
    checkAnswersPage.assertComment('Appointment level comment')

    checkAnswersPage.createAppointment()

    const confirmationPage = Page.verifyOnPage(ConfirmationPage)
    confirmationPage.assertMessageEquals(
      `You have successfully created an appointment for David Winchurch on ${formatDate(
        dayAfterTomorrow,
        'EEEE, d MMMM yyyy',
      )}.`,
    )
  })
})
