import { getDate } from 'date-fns'
import Page from '../../pages/page'
import IndexPage from '../../pages'
import AppointmentsManagementPage from '../../pages/appointments/appointmentsManagementPage'
import SelectPrisonerPage from '../../pages/appointments/create-and-edit/selectPrisonerPage'
import CategoryPage from '../../pages/appointments/create-and-edit/categoryPage'
import DescriptionPage from '../../pages/appointments/create-and-edit/descriptionPage'
import LocationPage from '../../pages/appointments/create-and-edit/locationPage'
import getPrisonPrisoners from '../../fixtures/prisonerSearchApi/getPrisonPrisoners-MDI-A8644DY.json'
import getPrisonerA8644DY from '../../fixtures/prisonerSearchApi/getPrisoner-MDI-A8644DY.json'
import getCategories from '../../fixtures/activitiesApi/getAppointmentCategories.json'
import getAppointmentLocations from '../../fixtures/prisonApi/getMdiAppointmentLocations.json'
import getAppointment from '../../fixtures/activitiesApi/getAppointment.json'
import getAppointmentDetails from '../../fixtures/activitiesApi/getAppointmentDetails.json'
import DateAndTimePage from '../../pages/appointments/create-and-edit/dateAndTimePage'
import RepeatPage from '../../pages/appointments/create-and-edit/repeatPage'
import CheckAnswersPage from '../../pages/appointments/create-and-edit/checkAnswersPage'
import ConfirmationPage from '../../pages/appointments/create-and-edit/confirmationPage'
import CommentPage from '../../pages/appointments/create-and-edit/commentPage'
import RepeatPeriodAndCountPage from '../../pages/appointments/create-and-edit/repeatPeriodAndCountPage'

context('Create individual appointment - back links', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubPrisonUser')
    cy.signIn()
    cy.stubEndpoint('GET', '/prison/MDI/prisoners\\?term=A8644DY', getPrisonPrisoners)
    cy.stubEndpoint('GET', '/prisoner/A8644DY', getPrisonerA8644DY)
    cy.stubEndpoint('GET', '/appointment-categories', getCategories)
    cy.stubEndpoint('GET', '/appointment-locations/MDI', getAppointmentLocations)
    cy.stubEndpoint('POST', '/appointments', getAppointment)
    cy.stubEndpoint('GET', '/appointment-details/10', getAppointmentDetails)
  })

  it('Create individual appointment - back links', () => {
    // Move through the journey to final page with back link
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.appointmentsManagementCard().click()

    const appointmentsManagementPage = Page.verifyOnPage(AppointmentsManagementPage)
    appointmentsManagementPage.createIndividualAppointmentCard().click()

    let selectPrisonerPage = Page.verifyOnPage(SelectPrisonerPage)
    selectPrisonerPage.enterPrisonerNumber('A8644DY')
    selectPrisonerPage.searchButton().click()

    selectPrisonerPage = Page.verifyOnPage(SelectPrisonerPage)
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
    const tomorrow = new Date()
    tomorrow.setDate(getDate(tomorrow) + 1)
    dateAndTimePage.enterStartDate(tomorrow)
    dateAndTimePage.selectStartTime(14, 0)
    dateAndTimePage.selectEndTime(15, 30)
    dateAndTimePage.continue()

    const repeatPage = Page.verifyOnPage(RepeatPage)
    repeatPage.selectRepeat('No')
    repeatPage.continue()

    const commentPage = Page.verifyOnPage(CommentPage)

    // Click through back links
    commentPage.back()
    Page.verifyOnPage(RepeatPage)
    repeatPage.selectRepeat('No')

    repeatPage.back()
    Page.verifyOnPage(DateAndTimePage)
    dateAndTimePage.assertStartDate(tomorrow)
    dateAndTimePage.assertStartTime(14, 0)
    dateAndTimePage.assertEndTime(15, 30)

    dateAndTimePage.back()
    Page.verifyOnPage(LocationPage)
    locationPage.assertSelectedLocation('Chapel')

    locationPage.back()
    Page.verifyOnPage(DescriptionPage)

    descriptionPage.back()
    Page.verifyOnPage(CategoryPage)
    categoryPage.assertSelectedCategory('Chaplaincy')

    categoryPage.back()
    Page.verifyOnPage(SelectPrisonerPage)
    selectPrisonerPage.assertEnteredPrisonerNumber('A8644DY')

    // Continue to comment page
    selectPrisonerPage.continue()
    categoryPage.continue()
    descriptionPage.continue()
    locationPage.continue()
    dateAndTimePage.continue()
    repeatPage.continue()

    Page.verifyOnPage(CommentPage)
    commentPage.continue()

    const checkAnswersPage = Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage.assertNoBackLink()

    // Back links from check answers
    checkAnswersPage.changePrisoner()
    Page.verifyOnPage(SelectPrisonerPage)
    selectPrisonerPage.back()
    Page.verifyOnPage(CheckAnswersPage)

    checkAnswersPage.changeCategory()
    Page.verifyOnPage(CategoryPage)
    categoryPage.back()
    Page.verifyOnPage(CheckAnswersPage)

    checkAnswersPage.changeLocation()
    Page.verifyOnPage(LocationPage)
    locationPage.back()
    Page.verifyOnPage(CheckAnswersPage)

    checkAnswersPage.changeStartDate()
    Page.verifyOnPage(DateAndTimePage)
    dateAndTimePage.back()
    Page.verifyOnPage(CheckAnswersPage)

    checkAnswersPage.changeStartTime()
    Page.verifyOnPage(DateAndTimePage)
    dateAndTimePage.back()
    Page.verifyOnPage(CheckAnswersPage)

    checkAnswersPage.changeEndTime()
    Page.verifyOnPage(DateAndTimePage)
    dateAndTimePage.back()
    Page.verifyOnPage(CheckAnswersPage)

    checkAnswersPage.changeRepeat()
    Page.verifyOnPage(RepeatPage)
    repeatPage.back()
    Page.verifyOnPage(CheckAnswersPage)

    // Repeat is a two page sub journey. Check it can be partially changed then backed out of without changing the answer
    checkAnswersPage.changeRepeat()
    Page.verifyOnPage(RepeatPage)
    repeatPage.selectRepeat('Yes')
    repeatPage.continue()
    const repeatPeriodAndCountPage = Page.verifyOnPage(RepeatPeriodAndCountPage)
    repeatPeriodAndCountPage.selectRepeatPeriod('Every weekday (Monday to Friday)')
    repeatPeriodAndCountPage.enterRepeatCount('5')
    repeatPeriodAndCountPage.back()
    Page.verifyOnPage(RepeatPage)
    repeatPage.back()
    checkAnswersPage.assertRepeat('No')

    checkAnswersPage.changeComment()
    Page.verifyOnPage(CommentPage)
    commentPage.back()
    Page.verifyOnPage(CheckAnswersPage)

    checkAnswersPage.createAppointment()

    const confirmationPage = Page.verifyOnPage(ConfirmationPage)
    confirmationPage.assertNoBackLink()
  })
})
