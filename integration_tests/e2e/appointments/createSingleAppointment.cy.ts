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
import { formatDate } from '../../../server/utils/utils'

context('Create single appointment', () => {
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

  it('Should complete create single appointment journey', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.appointmentsManagementCard().should('contain.text', 'Appointments management')
    indexPage
      .appointmentsManagementCard()
      .should('contain.text', 'Create and manage appointments for individuals and groups.')
    indexPage.appointmentsManagementCard().click()

    const appointmentsManagementPage = Page.verifyOnPage(AppointmentsManagementPage)
    appointmentsManagementPage.createSingleAppointmentCard().should('contain.text', 'Create a single appointment')
    appointmentsManagementPage
      .createSingleAppointmentCard()
      .should('contain.text', 'Create an appointment for a single prisoner in your prison.')
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

    const checkAnswersPage = Page.verifyOnPage(CheckAnswersPage)
    checkAnswersPage.assertPrisonerSummary('Stephen Gregs', 'A8644DY', '1-3')
    checkAnswersPage.assertCategory('Chaplaincy')
    checkAnswersPage.assertLocation('Chapel')
    checkAnswersPage.assertStartDate(tomorrow)
    checkAnswersPage.assertStartTime(14, 0)
    checkAnswersPage.assertEndTime(15, 30)
    checkAnswersPage.createAppointment()

    const confirmationPage = Page.verifyOnPage(ConfirmationPage)
    confirmationPage.assertMessageEquals(
      `You have successfully created an appointment for Stephen Gregs on ${formatDate(tomorrow, 'EEEE d MMMM yyyy')}.`,
    )
    confirmationPage.assertCreateAnotherLinkExists()
    confirmationPage.assertViewAppointmentLinkExists()
  })
})
