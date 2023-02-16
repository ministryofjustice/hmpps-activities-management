import Page from '../../pages/page'
import IndexPage from '../../pages'
import AppointmentsManagementPage from '../../pages/appointments/appointmentsManagementPage'
import SelectPrisonerPage from '../../pages/appointments/createSingle/selectPrisonerPage'
import CategoryPage from '../../pages/appointments/createSingle/categoryPage'
import LocationPage from '../../pages/appointments/createSingle/locationPage'
import prisonerAllocations from '../../fixtures/prisonerSearchApi/postMatchPrisonerA8644DY.json'
import getCategories from '../../fixtures/activitiesApi/getAppointmentCategories.json'
import getAppointmentLocations from '../../fixtures/prisonApi/getMdiAppointmentLocations.json'

context('Create single appointment', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubPrisonUser')
    cy.signIn()
    cy.stubEndpoint('POST', '/prisoner-search/match-prisoners', prisonerAllocations)
    cy.stubEndpoint('GET', '/appointment-categories', getCategories)
    cy.stubEndpoint('GET', '/api/agencies/MDI/locations\\?eventType=APP', getAppointmentLocations)
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
    selectPrisonerPage.enterPrisonerNumber('A1234BC')
    selectPrisonerPage.continue()

    const categoryPage = Page.verifyOnPage(CategoryPage)
    categoryPage.selectCategory('Chaplaincy')
    categoryPage.continue()

    const locationPage = Page.verifyOnPage(LocationPage)
    locationPage.selectLocation('Chapel')
    locationPage.continue()
  })
})
