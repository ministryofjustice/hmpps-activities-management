import { getDate } from 'date-fns'
import Page from '../../pages/page'
import IndexPage from '../../pages'
import AppointmentsManagementPage from '../../pages/appointments/appointmentsManagementPage'
import SelectPrisonerPage from '../../pages/appointments/createSingle/selectPrisonerPage'
import CategoryPage from '../../pages/appointments/createSingle/categoryPage'
import LocationPage from '../../pages/appointments/createSingle/locationPage'
import prisonerAllocations from '../../fixtures/prisonerSearchApi/postMatchPrisonerA8644DY.json'
import getCategories from '../../fixtures/activitiesApi/getAppointmentCategories.json'
import getAppointmentLocations from '../../fixtures/prisonApi/getMdiAppointmentLocations.json'
import DateAndTimePage from '../../pages/appointments/createSingle/dateAndTimePage'
import CheckAnswersPage from '../../pages/appointments/createSingle/checkAnswersPage'
import ConfirmationPage from '../../pages/appointments/createSingle/confirmationPage'

context('Create single appointment - back links', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubPrisonUser')
    cy.signIn()
    cy.stubEndpoint('POST', '/prisoner-search/match-prisoners', prisonerAllocations)
    cy.stubEndpoint('GET', '/appointment-categories', getCategories)
    cy.stubEndpoint('GET', '/api/agencies/MDI/locations\\?eventType=APP', getAppointmentLocations)
    cy.stubEndpoint('POST', '/appointments')
  })

  it('Create single appointment - back links', () => {
    // Move through the journey to final page with back link
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

    // Click through back links
    dateAndTimePage.back()
    Page.verifyOnPage(LocationPage)
    locationPage.assertSelectedLocation('Chapel')

    locationPage.back()
    Page.verifyOnPage(CategoryPage)
    categoryPage.assertSelectedCategory('Chaplaincy')

    categoryPage.back()
    Page.verifyOnPage(SelectPrisonerPage)
    selectPrisonerPage.assertEnteredPrisonerNumber('A8644DY')

    // Continue to date and time page
    selectPrisonerPage.continue()
    categoryPage.continue()
    locationPage.continue()

    Page.verifyOnPage(DateAndTimePage)
    const tomorrow = new Date()
    tomorrow.setDate(getDate(tomorrow) + 1)
    dateAndTimePage.enterStartDate(tomorrow)
    dateAndTimePage.selectStartTime(14, 0)
    dateAndTimePage.selectEndTime(15, 30)
    dateAndTimePage.continue()

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

    checkAnswersPage.createAppointment()

    const confirmationPage = Page.verifyOnPage(ConfirmationPage)
    confirmationPage.assertNoBackLink()
  })
})
