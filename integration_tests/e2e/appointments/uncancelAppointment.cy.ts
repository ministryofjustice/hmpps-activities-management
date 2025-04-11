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
import getRepeatGroupAppointment1Details from '../../fixtures/activitiesApi/getRepeatGroupAppointment1Details.json'
import getRepeatGroupAppointment1CancelledDetails from '../../fixtures/activitiesApi/getRepeatGroupAppointment1CancelledDetails.json'
import getAppointmentSeries from '../../fixtures/activitiesApi/getAppointmentSeries.json'
import getPrisonerAlerts from '../../fixtures/alertsApi/getPrisonerAlerts.json'
import getScheduledEvents from '../../fixtures/activitiesApi/getScheduledEventsMdi20230202.json'
import { formatDate } from '../../../server/utils/utils'
import getCancelledAppointmentSeries from '../../fixtures/activitiesApi/getCancelledAppointmentSeries.json'
import CancellationReasonPage from '../../pages/appointments/appointment/cancellationReasonPage'
import ConfirmEditPage from '../../pages/appointments/appointment/confirmEditPage'
import { AppointmentFrequency } from '../../../server/@types/appointments'
import ApplyToPage from '../../pages/appointments/appointment/applyToPage'

context('Uncancel appointment', () => {
  const tomorrow = addDays(new Date(), 1)
  const twoDaysFromNow = addDays(new Date(), 2)
  const tomorrowFormatted = formatDate(tomorrow, 'yyyy-MM-dd')
  const twoDaysFromNowFormatted = formatDate(twoDaysFromNow, 'yyyy-MM-dd')

  getGroupAppointmentSeriesDetails.startDate = tomorrowFormatted
  getGroupAppointmentSeriesDetails.appointments[0].startDate = getGroupAppointmentSeriesDetails.startDate

  getAppointmentDetails.startDate = tomorrowFormatted

  getCancelledAppointmentDetails.startDate = tomorrowFormatted
  getCancelledAppointmentDetails.cancelledTime = formatDate(new Date(), "yyyy-MM-dd'T'HH:mm:ss")

  getRepeatGroupAppointment1Details.startDate = tomorrowFormatted
  getRepeatGroupAppointment1Details.appointmentSeries.schedule.frequency = AppointmentFrequency.DAILY
  getRepeatGroupAppointment1Details.appointmentSeries.schedule.numberOfAppointments = 7

  getRepeatGroupAppointment1CancelledDetails.startDate = tomorrowFormatted
  getRepeatGroupAppointment1CancelledDetails.appointmentSeries.schedule.frequency = AppointmentFrequency.DAILY
  getRepeatGroupAppointment1CancelledDetails.appointmentSeries.schedule.numberOfAppointments = 7

  getCancelledAppointmentSeries.appointments[0].startDate = twoDaysFromNowFormatted
  getCancelledAppointmentSeries.appointments[1].startDate = twoDaysFromNowFormatted
  getCancelledAppointmentSeries.appointments[2].startDate = twoDaysFromNowFormatted

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
    cy.stubEndpoint('PUT', '/appointments/11/cancel', getCancelledAppointmentDetails)
    cy.stubEndpoint('PUT', '/appointments/11/uncancel', getAppointmentDetails)
    postPrisonerNumbers[0].status = 'ACTIVE_IN'
    postPrisonerNumbers[1].inOutStatus = 'IN'

    cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', postPrisonerNumbers)
  })

  it('Should be able to uncancel a single standalone appointment', () => {
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
    cancelledAppointmentDetailsPage.uncancelAppointmentLink().click()

    cy.stubEndpoint('GET', '/appointments/11/details', getAppointmentDetails)

    const uncancellationConfirmPage = Page.verifyOnPage(ConfirmEditPage)
    uncancellationConfirmPage.caption().should('contain.text', 'Chaplain Meeting (Chaplaincy)')
    uncancellationConfirmPage.yesRadioClick().click()
    uncancellationConfirmPage.confirm()

    const uncancelledAppointmentDetailsPage = Page.verifyOnPage(AppointmentDetailsPage)
    uncancelledAppointmentDetailsPage.assertNotificationContents("You've uncancelled this appointment")
  })

  it('Should be able to uncancel a single appointment in a series', () => {
    cy.stubEndpoint('GET', '/appointments/11/details', getRepeatGroupAppointment1Details)
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

    cy.stubEndpoint('GET', '/appointments/11/details', getRepeatGroupAppointment1CancelledDetails)

    const cancellationConfirmPage = Page.verifyOnPage(ConfirmEditPage)
    cancellationConfirmPage.caption().should('contain.text', 'Chaplain Meeting (Chaplaincy)')
    cancellationConfirmPage.yesRadioClick().click()
    cancellationConfirmPage.confirm()

    const cancelledAppointmentDetailsPage = Page.verifyOnPage(AppointmentDetailsPage)
    cancelledAppointmentDetailsPage.assertNotificationContents('Appointment cancelled')
    cancelledAppointmentDetailsPage.uncancelAppointmentLink().click()

    cy.stubEndpoint('GET', '/appointments/11/details', getRepeatGroupAppointment1Details)

    const uncancellationConfirmPage = Page.verifyOnPage(ConfirmEditPage)
    uncancellationConfirmPage.caption().should('contain.text', 'Chaplain Meeting (Chaplaincy)')
    uncancellationConfirmPage.yesRadioClick().click()
    uncancellationConfirmPage.confirm()

    const uncancelledAppointmentDetailsPage = Page.verifyOnPage(AppointmentDetailsPage)
    uncancelledAppointmentDetailsPage.assertNotificationContents("You've uncancelled this appointment")
  })

  it('Should be able to uncancel a single appointment in a series of cancelled appointments', () => {
    getAppointmentDetails.appointmentSeries = { id: 10 }
    getCancelledAppointmentDetails.appointmentSeries = { id: 10 }
    cy.stubEndpoint('GET', '/appointments/11/details', getAppointmentDetails)
    cy.stubEndpoint('GET', '/appointment-series/10/details', getCancelledAppointmentSeries)
    cy.stubEndpoint('POST', '/appointment-series', getCancelledAppointmentSeries)
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

    const applyToPage = Page.verifyOnPage(ApplyToPage)
    applyToPage.caption().should('contain.text', 'Chaplain Meeting (Chaplaincy)')
    applyToPage.applyToThisOneRadio().click()
    applyToPage.confirm()

    const cancelledAppointmentDetailsPage = Page.verifyOnPage(AppointmentDetailsPage)
    cancelledAppointmentDetailsPage.assertNotificationContents('Appointment cancelled')
    cancelledAppointmentDetailsPage.uncancelAppointmentLink().click()

    cy.stubEndpoint('GET', '/appointments/11/details', getAppointmentDetails)

    const uncancellationConfirmPage = Page.verifyOnPage(ConfirmEditPage)
    uncancellationConfirmPage.caption().should('contain.text', 'Chaplain Meeting (Chaplaincy)')
    uncancellationConfirmPage.yesRadioClick().click()
    uncancellationConfirmPage.continue()

    const applyToUncancelPage = Page.verifyOnPage(ApplyToPage)
    applyToUncancelPage.caption().should('contain.text', 'Chaplain Meeting (Chaplaincy)')
    applyToUncancelPage.applyToThisOneRadio().click()
    applyToUncancelPage.confirm()

    const uncancelledAppointmentDetailsPage = Page.verifyOnPage(AppointmentDetailsPage)
    uncancelledAppointmentDetailsPage.assertNotificationContents("You've uncancelled this appointment")
  })
})
