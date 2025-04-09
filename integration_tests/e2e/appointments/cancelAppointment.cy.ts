import { addDays } from 'date-fns'
import Page from '../../pages/page'
import IndexPage from '../../pages'
import getCategories from '../../fixtures/activitiesApi/getAppointmentCategories.json'
import getAppointmentLocations from '../../fixtures/prisonApi/getMdiAppointmentLocations.json'
import getAppointmentSearchResults from '../../fixtures/activitiesApi/getAppointmentSearchResults.json'
import postPrisonerNumbers from '../../fixtures/prisonerSearchApi/postPrisonerNumbers-A1350DZ-A8644DY-A1351DZ.json'
import AppointmentsManagementPage from '../../pages/appointments/appointmentsManagementPage'
import SearchSelectDatePage from '../../pages/appointments/appointment/searchSelectDatePage'
import SearchResultsPage from '../../pages/appointments/appointment/appointmentsSearchResultsPage'
import getAppointmentDetails from '../../fixtures/activitiesApi/getAppointmentDetails.json'
import getCancelledAppointmentDetails from '../../fixtures/activitiesApi/getCancelledAppointmentDetails.json'
import AppointmentDetailsPage from '../../pages/appointments/appointment/appointmentDetailsPage'
import getGroupAppointmentSeriesDetails from '../../fixtures/activitiesApi/getGroupAppointmentSeriesDetails.json'
import getPrisonerAlerts from '../../fixtures/alertsApi/getPrisonerAlerts.json'
import getScheduledEvents from '../../fixtures/activitiesApi/getScheduledEventsMdi20230202.json'
import { formatDate } from '../../../server/utils/utils'
import getAppointmentSeries from '../../fixtures/activitiesApi/getAppointmentSeries.json'
import CancellationReasonPage from '../../pages/appointments/appointment/cancellationReasonPage'
import ConfirmEditPage from '../../pages/appointments/appointment/confirmEditPage'

context('Cancel appointment', () => {
  const tomorrow = addDays(new Date(), 1)
  const tomorrowFormatted = formatDate(tomorrow, 'yyyy-MM-dd')

  getGroupAppointmentSeriesDetails.startDate = tomorrowFormatted
  getGroupAppointmentSeriesDetails.appointments[0].startDate = getGroupAppointmentSeriesDetails.startDate
  getAppointmentDetails.startDate = tomorrowFormatted
  getCancelledAppointmentDetails.startDate = tomorrowFormatted
  getCancelledAppointmentDetails.cancelledTime = formatDate(new Date(), "yyyy-MM-dd'T'HH:mm:ss")

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.signIn()
    cy.stubEndpoint('GET', '/appointment-categories', getCategories)
    cy.stubEndpoint('GET', '/appointment-locations/MDI', getAppointmentLocations)
    cy.stubEndpoint('POST', '/appointments/MDI/search', getAppointmentSearchResults)
    cy.stubEndpoint(
      'GET',
      '/users/jsmith',
      JSON.parse('{"name": "John Smith", "username": "jsmith", "authSource": "nomis"}'),
    )
    cy.stubEndpoint('GET', '/appointment-series/10/details', getGroupAppointmentSeriesDetails)
    cy.stubEndpoint('POST', '/search/alerts/prison-numbers\\?includeInactive=false', getPrisonerAlerts)
    cy.stubEndpoint('POST', `/scheduled-events/prison/MDI\\?date=${tomorrowFormatted}`, getScheduledEvents)
    cy.stubEndpoint('POST', '/appointment-series', getAppointmentSeries)
    cy.stubEndpoint('PUT', '/appointments/11/cancel', getAppointmentDetails)
  })

  it('Should be able to cancel a single appointment', () => {
    postPrisonerNumbers[0].status = 'ACTIVE_IN'
    postPrisonerNumbers[1].inOutStatus = 'IN'

    cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', postPrisonerNumbers)
    cy.stubEndpoint('GET', '/appointments/11/details', getAppointmentDetails)

    Page.verifyOnPage(IndexPage).appointmentsManagementCard().click()

    Page.verifyOnPage(AppointmentsManagementPage).searchAppointmentsCard().click()

    const searchSelectDatePage = Page.verifyOnPage(SearchSelectDatePage)
    searchSelectDatePage.selectDatePickerDate(tomorrow)
    searchSelectDatePage.continue()

    const searchResultsDatePage = Page.verifyOnPage(SearchResultsPage)
    searchResultsDatePage.assertResultsLocation(0, getAppointmentSearchResults[0].internalLocation.description)
    searchResultsDatePage.assertResultsLocation(1, 'In cell')
    searchResultsDatePage.viewLink(0).click()

    const originalAppointmentDetailsPage = Page.verifyOnPage(AppointmentDetailsPage)
    originalAppointmentDetailsPage.cancelAppointmentLink().click()

    const cancellationReasonPage = Page.verifyOnPage(CancellationReasonPage)
    cancellationReasonPage.caption().should('contain.text', 'Chaplain Meeting (Chaplaincy)')
    cancellationReasonPage.yesShowAppointmentRadioClick().click()
    cancellationReasonPage.continue()

    cy.stubEndpoint('GET', '/appointments/11/details', getCancelledAppointmentDetails)

    const cancellationConfirmPage = Page.verifyOnPage(ConfirmEditPage)
    cancellationConfirmPage.caption().should('contain.text', 'Chaplain Meeting (Chaplaincy)')
    cancellationConfirmPage.yesRadioClick().click()
    cancellationConfirmPage.confirm()

    const cancelledAppointmentDetailsPage = Page.verifyOnPage(AppointmentDetailsPage)
    cancelledAppointmentDetailsPage.assertNotificationContents('Appointment cancelled')
  })
})
