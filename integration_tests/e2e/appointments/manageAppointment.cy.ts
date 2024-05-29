import { addDays } from 'date-fns'
import Page from '../../pages/page'
import IndexPage from '../../pages'
import AppointmentsManagementPage from '../../pages/appointments/appointmentsManagementPage'
import getCategories from '../../fixtures/activitiesApi/getAppointmentCategories.json'
import getAppointmentLocations from '../../fixtures/prisonApi/getMdiAppointmentLocations.json'
import SearchSelectDatePage from '../../pages/appointments/appointment/searchSelectDatePage'
import SearchResultsPage from '../../pages/appointments/appointment/appointmentsSearchResultsPage'
import getAppointmentSearchResults from '../../fixtures/activitiesApi/getAppointmentSearchResults.json'
import postPrisonerNumbers from '../../fixtures/prisonerSearchApi/postPrisonerNumbers-A1350DZ-A8644DY.json'

context('Manage appointment', () => {
  const tomorrow = addDays(new Date(), 1)

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.signIn()
    cy.stubEndpoint('GET', '/appointment-categories', getCategories)
    cy.stubEndpoint('GET', '/appointment-locations/MDI', getAppointmentLocations)
    cy.stubEndpoint('POST', '/appointments/MDI/search', getAppointmentSearchResults)
    cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', postPrisonerNumbers)
  })

  it('Should be able to view appointments', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.appointmentsManagementCard().should('contain.text', 'Appointments scheduling and attendance')
    indexPage.appointmentsManagementCard().click()

    const searchAppointmentsPage = Page.verifyOnPage(AppointmentsManagementPage)
    searchAppointmentsPage.searchAppointmentsCard().click()

    const searchSelectDatePage = Page.verifyOnPage(SearchSelectDatePage)
    searchSelectDatePage.selectDatePickerDate(tomorrow)
    searchSelectDatePage.continue()

    const searchResultsDatePage = Page.verifyOnPage(SearchResultsPage)
    searchResultsDatePage.assertResultsLocation(0, getAppointmentSearchResults[0].internalLocation.description)
    searchResultsDatePage.assertResultsLocation(1, 'In cell')
  })
})
