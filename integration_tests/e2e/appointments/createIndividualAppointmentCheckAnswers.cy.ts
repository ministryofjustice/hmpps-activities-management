import { getDate } from 'date-fns'
import Page from '../../pages/page'
import IndexPage from '../../pages'
import AppointmentsManagementPage from '../../pages/appointments/appointmentsManagementPage'
import SelectPrisonerPage from '../../pages/appointments/create/selectPrisonerPage'
import CategoryPage from '../../pages/appointments/create/categoryPage'
import LocationPage from '../../pages/appointments/create/locationPage'
import postMatchPrisonerA8644DY from '../../fixtures/prisonerSearchApi/postMatchPrisonerA8644DY.json'
import postMatchPrisonerA1350DZ from '../../fixtures/prisonerSearchApi/postMatchPrisonerA1350DZ.json'
import getCategories from '../../fixtures/activitiesApi/getAppointmentCategories.json'
import getAppointmentLocations from '../../fixtures/prisonApi/getMdiAppointmentLocations.json'
import DateAndTimePage from '../../pages/appointments/create/dateAndTimePage'
import RepeatPage from '../../pages/appointments/create/repeatPage'
import CheckAnswersPage from '../../pages/appointments/create/checkAnswersPage'
import ConfirmationPage from '../../pages/appointments/create/confirmationPage'
import { formatDate } from '../../../server/utils/utils'

context('Create individual appointment - check answers change links', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubPrisonUser')
    cy.signIn()
    cy.stubEndpoint('POST', '/prisoner-search/match-prisoners', postMatchPrisonerA8644DY)
    cy.stubEndpoint('GET', '/appointment-categories', getCategories)
    cy.stubEndpoint('GET', '/api/agencies/MDI/locations\\?eventType=APP', getAppointmentLocations)
    cy.stubEndpoint('POST', '/appointments')
  })

  it('Create individual appointment - check answers change links', () => {
    // Move through the journey to check answers page
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.appointmentsManagementCard().click()

    const appointmentsManagementPage = Page.verifyOnPage(AppointmentsManagementPage)
    appointmentsManagementPage.createSingleAppointmentCard().click()

    const selectPrisonerPage = Page.verifyOnPage(SelectPrisonerPage)
    selectPrisonerPage.enterPrisonerNumber('A8644DY')
    selectPrisonerPage.continue()

    const categoryPage = Page.verifyOnPage(CategoryPage)
    categoryPage.selectCategory('Chaplaincy')
    categoryPage.continue()

    const locationPage = Page.verifyOnPage(LocationPage)
    locationPage.selectLocation('Chapel')
    locationPage.continue()

    const dateAndTimePage = Page.verifyOnPage(DateAndTimePage)
    const tomorrow = new Date()
    tomorrow.setDate(getDate(tomorrow) + 1)
    dateAndTimePage.enterStartDate(tomorrow)
    dateAndTimePage.selectStartTime(14, 0)
    dateAndTimePage.selectEndTime(15, 30)
    dateAndTimePage.continue()

    const repeatPage = Page.verifyOnPage(RepeatPage)
    repeatPage.selectRepeat('No')
    repeatPage.continue()

    // Verify initial answers
    const checkAnswersPage = Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage.assertPrisonerSummary('Stephen Gregs', 'A8644DY', '1-3')
    checkAnswersPage.assertCategory('Chaplaincy')
    checkAnswersPage.assertLocation('Chapel')
    checkAnswersPage.assertStartDate(tomorrow)
    checkAnswersPage.assertStartTime(14, 0)
    checkAnswersPage.assertEndTime(15, 30)
    checkAnswersPage.assertRepeat('No')

    // Change each answer
    checkAnswersPage.changePrisoner()
    Page.verifyOnPage(SelectPrisonerPage)
    selectPrisonerPage.assertEnteredPrisonerNumber('A8644DY')
    cy.stubEndpoint('POST', '/prisoner-search/match-prisoners', postMatchPrisonerA1350DZ)
    selectPrisonerPage.continue()
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
    const dayAfterTomorrow = new Date()
    dayAfterTomorrow.setDate(getDate(dayAfterTomorrow) + 2)
    dateAndTimePage.enterStartDate(dayAfterTomorrow)
    dateAndTimePage.continue()
    Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage.assertStartDate(dayAfterTomorrow)

    checkAnswersPage.changeStartTime()
    Page.verifyOnPage(DateAndTimePage)
    dateAndTimePage.assertStartTime(14, 0)
    dateAndTimePage.selectStartTime(15, 5)
    dateAndTimePage.continue()
    Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage.assertStartTime(15, 5)

    checkAnswersPage.changeEndTime()
    Page.verifyOnPage(DateAndTimePage)
    dateAndTimePage.assertEndTime(15, 30)
    dateAndTimePage.selectEndTime(16, 15)
    dateAndTimePage.continue()
    Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage.assertEndTime(16, 15)

    checkAnswersPage.createAppointment()

    const confirmationPage = Page.verifyOnPage(ConfirmationPage)
    confirmationPage.assertMessageEquals(
      `You have successfully created an appointment for David Winchurch on ${formatDate(
        dayAfterTomorrow,
        'EEEE d MMMM yyyy',
      )}.`,
    )
  })
})
