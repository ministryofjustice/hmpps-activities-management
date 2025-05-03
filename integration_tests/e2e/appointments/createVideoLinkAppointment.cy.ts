import { addDays } from 'date-fns'
import Page from '../../pages/page'
import IndexPage from '../../pages'
import AppointmentsManagementPage from '../../pages/appointments/appointmentsManagementPage'
import SelectPrisonerPage from '../../pages/appointments/create-and-edit/selectPrisonerPage'
import NamePage from '../../pages/appointments/create-and-edit/namePage'
import getCategories from '../../fixtures/activitiesApi/getAppointmentCategories.json'
import getMdiAppointmentLocations from '../../fixtures/prisonApi/getMdiAppointmentLocations.json'
import getScheduledEvents from '../../fixtures/activitiesApi/getScheduleEvents-MDI-A1350DZ-A8644DY.json'
import getScheduledEventLocations from '../../fixtures/activitiesApi/getScheduledEventLocations.json'
import HowToAddPrisonersPage from '../../pages/appointments/create-and-edit/howToAddPrisonersPage'
import ReviewPrisonersPage from '../../pages/appointments/create-and-edit/reviewPrisonersPage'
import { formatDate } from '../../../server/utils/utils'
import ExtraInformationPage from '../../pages/appointments/create-and-edit/extraInformationPage'
import getPrisonPrisoners from '../../fixtures/prisonerSearchApi/getPrisonPrisoners-MDI-A8644DY.json'
import getPrisonerA8644DY from '../../fixtures/prisonerSearchApi/getPrisoner-MDI-A8644DY.json'
import getAppointmentDetails from '../../fixtures/activitiesApi/getAppointmentDetails.json'
import ReviewPrisonerAlertsPage from '../../pages/appointments/create-and-edit/reviewPrisonerAlertsPage'
import getCourtList from '../../fixtures/bookAVideoLinkApi/getCourtList.json'
import getCourtHearingTypes from '../../fixtures/bookAVideoLinkApi/getCourtHearingTypes.json'
import getBvlsLocations from '../../fixtures/bookAVideoLinkApi/getBvlsLocations.json'
import getBvlsVccRoom1 from '../../fixtures/bookAVideoLinkApi/getBvlsLocation-VCC_ROOM_1.json'
import getBvlsCompletedBooking from '../../fixtures/bookAVideoLinkApi/getBvlsCompletedBooking.json'
import getPrisonerAlerts from '../../fixtures/alertsApi/getPrisonerAlertsA8644DY.json'
import PrisonLocationsPage from '../../pages/appointments/create-and-edit/video-link-booking/prisonLocationsPage'
import HearingDetailsPage from '../../pages/appointments/create-and-edit/video-link-booking/hearingDetailsPage'
import VideoLinkDateAndTimePage from '../../pages/appointments/create-and-edit/video-link-booking/videoLinkDateAndTimePage'
import CourtHearingLinkPage from '../../pages/appointments/create-and-edit/video-link-booking/courtHearingLinkPage'
import VideoLinkSchedulePage from '../../pages/appointments/create-and-edit/video-link-booking/videoLinkSchedulePage'
import VideoLinkCheckAnswersPage from '../../pages/appointments/create-and-edit/video-link-booking/videoLinkCheckAnswersPage'
import VideoLinkConfirmationPage from '../../pages/appointments/create-and-edit/video-link-booking/videoLinkConfirmationPage'
import { YesNo } from '../../../server/@types/activities'

context('Create video link appointments', () => {
  const tomorrow = addDays(new Date(), 1)
  const tomorrowFormatted = formatDate(tomorrow, 'yyyy-MM-dd')

  // To pass validation we must ensure the appointment start date is set to tomorrow
  getScheduledEvents.activities
    .filter(e => e.prisonerNumber === 'A7789DY')
    .forEach(e => {
      e.prisonerNumber = 'A8644DY'
    })
  getAppointmentDetails.startDate = tomorrowFormatted

  // Ensure the BVLS booking confirmation reflects tomorrow's date too
  getBvlsCompletedBooking.prisonAppointments[0].appointmentDate = tomorrowFormatted

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.signIn()

    // A&A API stubs
    cy.stubEndpoint('GET', '/appointment-categories', getCategories)
    cy.stubEndpoint('POST', `/scheduled-events/prison/MDI\\?date=${tomorrowFormatted}`, getScheduledEvents)
    cy.stubEndpoint(
      'POST',
      `/scheduled-events/prison/MDI/locations\\?date=${tomorrowFormatted}`,
      getScheduledEventLocations,
    )

    // Manage users API
    cy.stubEndpoint(
      'GET',
      '/users/jsmith',
      JSON.parse('{"name": "John Smith", "username": "jsmith", "authSource": "nomis"}'),
    )

    // Alerts API stubs
    cy.stubEndpoint('POST', '/search/alerts/prison-numbers\\?includeInactive=false', getPrisonerAlerts)

    // Non-associations API stubs
    cy.stubEndpoint('POST', '/non-associations/between', [])

    // Prisoner search API stubs
    cy.stubEndpoint('GET', '/prison/MDI/prisoners\\?term=A8644DY&size=50', getPrisonPrisoners)
    cy.stubEndpoint('GET', '/prisoner/A8633DY', getPrisonPrisoners)
    cy.stubEndpoint('GET', '/prisoner/A8644DY', getPrisonerA8644DY)

    // Prison API stubs
    cy.stubEndpoint('GET', '/appointment-locations/MDI', getMdiAppointmentLocations)

    // Video link booking API stubs
    cy.stubEndpoint('GET', '/courts\\?enabledOnly=false', getCourtList)
    cy.stubEndpoint('GET', '/reference-codes/group/COURT_HEARING_TYPE', getCourtHearingTypes)
    cy.stubEndpoint('GET', '/prisons/MDI/locations\\?videoLinkOnly=false', getBvlsLocations)
    cy.stubEndpoint('GET', '/api/locations/code/VCC-ROOM-1', getBvlsVccRoom1)
    cy.stubEndpoint('POST', '/video-link-booking', JSON.parse('1234'))
    cy.stubEndpoint('GET', '/video-link-booking/id/1234', getBvlsCompletedBooking)
  })

  it('Should create a video link court hearing', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.appointmentsManagementCard().click()

    const appointmentsManagementPage = Page.verifyOnPage(AppointmentsManagementPage)
    appointmentsManagementPage.createGroupAppointmentCard().click()

    const howToAddPrisonersPage = Page.verifyOnPage(HowToAddPrisonersPage)
    howToAddPrisonersPage.selectOneByOne()
    howToAddPrisonersPage.continue()

    const selectPrisonerPage = Page.verifyOnPage(SelectPrisonerPage)
    selectPrisonerPage.enterPrisonerNumber('A8644DY')
    selectPrisonerPage.searchButton().click()
    selectPrisonerPage.continueButton().click()

    const reviewPrisonersPage = Page.verifyOnPage(ReviewPrisonersPage)
    reviewPrisonersPage.assertPrisonerInList('Gregs, Stephen')
    reviewPrisonersPage.continue()

    const reviewPrisonerAlertsPage = Page.verifyOnPage(ReviewPrisonerAlertsPage)
    reviewPrisonerAlertsPage.continue()

    const namePage = Page.verifyOnPage(NamePage)
    namePage.selectCategory('Video Link - Court Hearing')
    namePage.continue()

    // Type of meeting page
    const hearingDetailsPage = Page.verifyOnPage(HearingDetailsPage)
    hearingDetailsPage.selectCourt('Aylesbury Crown')
    hearingDetailsPage.selectHearingType('Bail')
    hearingDetailsPage.continue()

    // Location in the VCC
    const prisonLocationsPage = Page.verifyOnPage(PrisonLocationsPage)
    prisonLocationsPage.selectLocation('VCC Room 1')
    prisonLocationsPage.continue()

    // Date of hearing, start and end times, whether a pre-hearing, or post-hearing, is required
    const videoLinkDateAndTimePage = Page.verifyOnPage(VideoLinkDateAndTimePage)
    videoLinkDateAndTimePage.selectDate(tomorrow)
    videoLinkDateAndTimePage.selectStartTime(14, 0)
    videoLinkDateAndTimePage.selectEndTime(15, 30)
    videoLinkDateAndTimePage.preCourtHearing(YesNo.NO)
    videoLinkDateAndTimePage.postCourtHearing(YesNo.NO)
    videoLinkDateAndTimePage.continue()

    // Review events for the prisoner
    const schedulePage = Page.verifyOnPage(VideoLinkSchedulePage)
    schedulePage.continue()

    // CVP link
    const courtHearingLinkPage = Page.verifyOnPage(CourtHearingLinkPage)
    courtHearingLinkPage.selectYes()
    courtHearingLinkPage.enterCvpLink('https://test.video.link/1234')
    courtHearingLinkPage.continue()

    // Extra information
    const extraInformationPage = Page.verifyOnPage(ExtraInformationPage)
    extraInformationPage.continue()

    // Specific check answers page for video link bookings
    const checkAnswersPage = Page.verifyOnPage(VideoLinkCheckAnswersPage)
    checkAnswersPage.assertPrisonerInList('Gregs, Stephen', 'A8644DY')
    checkAnswersPage.assertCourt('Aylesbury Crown')
    checkAnswersPage.assertHearingType('Bail')
    checkAnswersPage.assertCategory('Video Link - Court Hearing')
    checkAnswersPage.assertHearingLink('https://test.video.link/1234')
    checkAnswersPage.assertMainLocation('VCC Room 1')
    checkAnswersPage.assertMainStartDate(tomorrow)
    checkAnswersPage.assertMainStartTime(14, 0)
    checkAnswersPage.assertMainEndTime(15, 30)
    checkAnswersPage.assertPreHearingNone()
    checkAnswersPage.assertPostHearingNone()
    checkAnswersPage.createAppointment()

    const confirmationPage = Page.verifyOnPage(VideoLinkConfirmationPage)
    const successMessage = `You have successfully scheduled an appointment for Stephen Gregs on ${formatDate(
      tomorrow,
      'EEEE, d MMMM yyyy',
    )}.`
    confirmationPage.assertMessageEquals(successMessage)
    confirmationPage.assertCreateAnotherLinkExists()
    confirmationPage.assertViewAppointmentLinkExists()
  })
})
