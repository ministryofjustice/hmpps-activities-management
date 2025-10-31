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
import getProbationTeamList from '../../fixtures/bookAVideoLinkApi/getProbationTeamList.json'
import getThreeProbationMeetingTypes from '../../fixtures/bookAVideoLinkApi/getThreeProbationMeetingTypes.json'
import getFourProbationMeetingTypes from '../../fixtures/bookAVideoLinkApi/getFourProbationMeetingTypes.json'
import getBvlsLocations from '../../fixtures/bookAVideoLinkApi/getBvlsLocations.json'
import getBvlsVccRoom1 from '../../fixtures/bookAVideoLinkApi/getBvlsLocation-VCC_ROOM_1.json'
import getCompletedProbationBooking from '../../fixtures/bookAVideoLinkApi/getCompletedProbationBooking.json'
import getPrisonerAlerts from '../../fixtures/alertsApi/getPrisonerAlertsA8644DY.json'
import PrisonLocationsPage from '../../pages/appointments/create-and-edit/video-link-booking/prisonLocationsPage'
import ProbationMeetingDetailsPage from '../../pages/appointments/create-and-edit/video-link-booking/probationMeetingDetailsPage'
import VideoLinkDateAndTimePage from '../../pages/appointments/create-and-edit/video-link-booking/videoLinkDateAndTimePage'
import VideoLinkSchedulePage from '../../pages/appointments/create-and-edit/video-link-booking/videoLinkSchedulePage'
import VideoLinkProbationCheckAnswersPage from '../../pages/appointments/create-and-edit/video-link-booking/videoLinkProbationCheckAnswersPage'
import VideoLinkConfirmationPage from '../../pages/appointments/create-and-edit/video-link-booking/videoLinkConfirmationPage'

context('Create video link probation appointment', () => {
  const tomorrow = addDays(new Date(), 1)
  const tomorrowFormatted = formatDate(tomorrow, 'yyyy-MM-dd')

  // This puts activities onto the prisoner's schedule for the same day - but has no impact on the test result
  getScheduledEvents.activities
    .filter(e => e.prisonerNumber === 'A8644DY')
    .forEach(e => {
      e.date = tomorrowFormatted
    })

  // Ensure the appointment start date is set to tomorrow
  getAppointmentDetails.startDate = tomorrowFormatted

  // Ensure the booking confirmation reflects tomorrow's date
  getCompletedProbationBooking.prisonAppointments[0].appointmentDate = tomorrowFormatted

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.signIn()

    // A&A API stubs
    cy.stubEndpoint('GET', '/appointment-categories', getCategories)
    cy.stubEndpoint(
      'POST',
      `/scheduled-events/prison/MDI\\?date=${tomorrowFormatted}`,
      getScheduledEvents as unknown as JSON,
    )
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
    cy.stubEndpoint(
      'POST',
      '/search/alerts/prison-numbers\\?includeInactive=false',
      getPrisonerAlerts as unknown as JSON,
    )

    // Non-associations API stubs
    cy.stubEndpoint('POST', '/non-associations/between', [])

    // Prisoner search API stubs
    cy.stubEndpoint('GET', '/prison/MDI/prisoners\\?term=A8644DY&size=50', getPrisonPrisoners as unknown as JSON)
    cy.stubEndpoint('GET', '/prisoner/A8633DY', getPrisonPrisoners as unknown as JSON)
    cy.stubEndpoint('GET', '/prisoner/A8644DY', getPrisonerA8644DY as unknown as JSON)

    // Prison API stubs
    cy.stubEndpoint('GET', '/appointment-locations/MDI', getMdiAppointmentLocations)

    // Video link booking API stubs
    cy.stubEndpoint('GET', '/prisons/MDI/locations\\?videoLinkOnly=false', getBvlsLocations)
    cy.stubEndpoint('GET', '/api/locations/code/VCC-ROOM-1', getBvlsVccRoom1 as unknown as JSON)
    cy.stubEndpoint('POST', '/video-link-booking', JSON.parse('1234'))
    cy.stubEndpoint('GET', '/video-link-booking/id/1234', getCompletedProbationBooking as unknown as JSON)
    cy.stubEndpoint('GET', '/probation-teams\\?enabledOnly=false', getProbationTeamList)
  })

  it('Should create a video link probation meeting (using RADIO for meeting type)', () => {
    cy.stubEndpoint('GET', '/reference-codes/group/PROBATION_MEETING_TYPE', getThreeProbationMeetingTypes)

    // Home page
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.appointmentsManagementCard().click()

    // Appointments page
    const appointmentsManagementPage = Page.verifyOnPage(AppointmentsManagementPage)
    appointmentsManagementPage.createGroupAppointmentCard().click()

    // How to add prisoners page
    const howToAddPrisonersPage = Page.verifyOnPage(HowToAddPrisonersPage)
    howToAddPrisonersPage.selectOneByOne()
    howToAddPrisonersPage.continue()

    // Select specific prisoner page
    const selectPrisonerPage = Page.verifyOnPage(SelectPrisonerPage)
    selectPrisonerPage.enterPrisonerNumber('A8644DY')
    selectPrisonerPage.searchButton().click()
    selectPrisonerPage.continueButton().click()

    // Review prisoners page
    const reviewPrisonersPage = Page.verifyOnPage(ReviewPrisonersPage)
    reviewPrisonersPage.assertPrisonerInList('Gregs, Stephen')
    reviewPrisonersPage.continue()

    // Review alerts page
    const reviewPrisonerAlertsPage = Page.verifyOnPage(ReviewPrisonerAlertsPage)
    reviewPrisonerAlertsPage.continue()

    // Appointment type page
    const namePage = Page.verifyOnPage(NamePage)
    namePage.selectCategory('Video Link - Probation Meeting')
    namePage.continue()

    // Location in prison page
    const prisonLocationsPage = Page.verifyOnPage(PrisonLocationsPage)
    prisonLocationsPage.selectLocation('VCC Room 1')
    prisonLocationsPage.continue()

    // Probation team, type of meeting and officer details page
    const meetingDetailsPage = Page.verifyOnPage(ProbationMeetingDetailsPage)
    meetingDetailsPage.selectProbationTeam('Barking - Probation')
    meetingDetailsPage.selectRadioFirstMeetingType()
    meetingDetailsPage.checkOfficerDetailsNotKnown()
    meetingDetailsPage.continue()

    // Date and time of meeting page
    const videoLinkDateAndTimePage = Page.verifyOnPage(VideoLinkDateAndTimePage)
    videoLinkDateAndTimePage.selectDate(tomorrow)
    videoLinkDateAndTimePage.selectStartTime(14, 0)
    videoLinkDateAndTimePage.selectEndTime(15, 30)
    videoLinkDateAndTimePage.continue()

    // Review events for the prisoner page
    const schedulePage = Page.verifyOnPage(VideoLinkSchedulePage)
    schedulePage.continue()

    // Extra information page
    const extraInformationPage = Page.verifyOnPage(ExtraInformationPage)
    extraInformationPage.enterStaffNotes('some staff notes')
    extraInformationPage.enterPrisonersNotes('some prisoners notes')
    extraInformationPage.continue()

    // Specific check answers page for video link probation bookings
    const checkAnswersPage = Page.verifyOnPage(VideoLinkProbationCheckAnswersPage)
    checkAnswersPage.assertPrisonerInList('Gregs, Stephen', 'A8644DY')
    checkAnswersPage.assertProbationTeam('Barking - Probation')
    checkAnswersPage.assertMeetingType('Pre-sentence report')
    checkAnswersPage.assertCategory('Video Link - Probation Meeting')
    checkAnswersPage.assertLocation('VCC Room 1')
    checkAnswersPage.assertStartDate(tomorrow)
    checkAnswersPage.assertStartTime(14, 0)
    checkAnswersPage.assertEndTime(15, 30)
    checkAnswersPage.assertNotesForStaff('some staff notes')
    checkAnswersPage.assertNotesForPrisoners('some prisoners notes')
    checkAnswersPage.createAppointment()

    // Confirmation page
    const confirmationPage = Page.verifyOnPage(VideoLinkConfirmationPage)
    const successMessage = `You have successfully scheduled an appointment for Stephen Gregs on ${formatDate(
      tomorrow,
      'EEEE, d MMMM yyyy',
    )}.`
    confirmationPage.assertMessageEquals(successMessage)
    confirmationPage.assertCreateAnotherLinkExists()
    confirmationPage.assertViewAppointmentLinkExists()
  })

  it('Should create a video link probation meeting (using SELECT for meeting type)', () => {
    cy.stubEndpoint('GET', '/reference-codes/group/PROBATION_MEETING_TYPE', getFourProbationMeetingTypes)

    // Home page
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.appointmentsManagementCard().click()

    // Appointments page
    const appointmentsManagementPage = Page.verifyOnPage(AppointmentsManagementPage)
    appointmentsManagementPage.createGroupAppointmentCard().click()

    // How to add prisoners page
    const howToAddPrisonersPage = Page.verifyOnPage(HowToAddPrisonersPage)
    howToAddPrisonersPage.selectOneByOne()
    howToAddPrisonersPage.continue()

    // Select specific prisoner page
    const selectPrisonerPage = Page.verifyOnPage(SelectPrisonerPage)
    selectPrisonerPage.enterPrisonerNumber('A8644DY')
    selectPrisonerPage.searchButton().click()
    selectPrisonerPage.continueButton().click()

    // Review prisoners page
    const reviewPrisonersPage = Page.verifyOnPage(ReviewPrisonersPage)
    reviewPrisonersPage.assertPrisonerInList('Gregs, Stephen')
    reviewPrisonersPage.continue()

    // Review alerts page
    const reviewPrisonerAlertsPage = Page.verifyOnPage(ReviewPrisonerAlertsPage)
    reviewPrisonerAlertsPage.continue()

    // Appointment type page
    const namePage = Page.verifyOnPage(NamePage)
    namePage.selectCategory('Video Link - Probation Meeting')
    namePage.continue()

    // Location in prison page
    const prisonLocationsPage = Page.verifyOnPage(PrisonLocationsPage)
    prisonLocationsPage.selectLocation('VCC Room 1')
    prisonLocationsPage.continue()

    // Probation team, type of meeting and officer details page
    const meetingDetailsPage = Page.verifyOnPage(ProbationMeetingDetailsPage)
    meetingDetailsPage.selectProbationTeam('Barking - Probation')
    meetingDetailsPage.selectMeetingType('Other')
    meetingDetailsPage.checkOfficerDetailsNotKnown()
    meetingDetailsPage.continue()

    // Date and time of meeting page
    const videoLinkDateAndTimePage = Page.verifyOnPage(VideoLinkDateAndTimePage)
    videoLinkDateAndTimePage.selectDate(tomorrow)
    videoLinkDateAndTimePage.selectStartTime(14, 0)
    videoLinkDateAndTimePage.selectEndTime(15, 30)
    videoLinkDateAndTimePage.continue()

    // Review events for the prisoner page
    const schedulePage = Page.verifyOnPage(VideoLinkSchedulePage)
    schedulePage.continue()

    // Extra information page
    const extraInformationPage = Page.verifyOnPage(ExtraInformationPage)
    extraInformationPage.enterStaffNotes('some staff notes')
    extraInformationPage.enterPrisonersNotes('some prisoners notes')
    extraInformationPage.continue()

    // Specific check answers page for video link probation bookings
    const checkAnswersPage = Page.verifyOnPage(VideoLinkProbationCheckAnswersPage)
    checkAnswersPage.assertPrisonerInList('Gregs, Stephen', 'A8644DY')
    checkAnswersPage.assertProbationTeam('Barking - Probation')
    checkAnswersPage.assertMeetingType('Other')
    checkAnswersPage.assertCategory('Video Link - Probation Meeting')
    checkAnswersPage.assertLocation('VCC Room 1')
    checkAnswersPage.assertStartDate(tomorrow)
    checkAnswersPage.assertStartTime(14, 0)
    checkAnswersPage.assertEndTime(15, 30)
    checkAnswersPage.assertNotesForStaff('some staff notes')
    checkAnswersPage.assertNotesForPrisoners('some prisoners notes')
    checkAnswersPage.createAppointment()

    // Confirmation page
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
