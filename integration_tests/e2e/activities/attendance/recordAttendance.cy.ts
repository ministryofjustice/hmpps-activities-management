import { format, startOfToday } from 'date-fns'
import IndexPage from '../../../pages'
import Page from '../../../pages/page'
import SelectPeriodPage from '../../../pages/recordAttendance/selectPeriod'
import ActivitiesPage from '../../../pages/recordAttendance/activitiesPage'
import AttendanceListPage from '../../../pages/recordAttendance/attendanceList'
import CancelSessionReason from '../../../pages/recordAttendance/cancelSessionReason'
import CancelSessionConfirm from '../../../pages/recordAttendance/cancelSessionConfirm'
import UncancelSessionConfirm from '../../../pages/recordAttendance/uncancelSessionConfirm'
import getAttendanceSummary from '../../../fixtures/activitiesApi/getAttendanceSummary.json'
import getScheduledInstance from '../../../fixtures/activitiesApi/getScheduledInstance93.json'
import getAttendeesForScheduledInstance from '../../../fixtures/activitiesApi/getAttendeesScheduledInstance93.json'
import getCancelledScheduledInstance from '../../../fixtures/activitiesApi/getScheduledInstance-cancelled.json'
import getScheduledEvents from '../../../fixtures/activitiesApi/getScheduledEventsMdi20230202.json'
import getInmateDetails from '../../../fixtures/prisonerSearchApi/getInmateDetailsForAttendance.json'
import getCategories from '../../../fixtures/activitiesApi/getCategories.json'
import AttendanceDashboardPage from '../../../pages/recordAttendance/attendanceDashboard'
import ActivitiesIndexPage from '../../../pages/activities'
import getEventLocations from '../../../fixtures/prisonApi/getEventLocations.json'

context('Record attendance', () => {
  const today = format(startOfToday(), 'yyyy-MM-dd')

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.signIn()

    getScheduledInstance.date = today
    getCancelledScheduledInstance.date = today

    cy.stubEndpoint(
      'GET',
      `/scheduled-instances/attendance-summary\\?prisonCode=MDI&date=${today}`,
      getAttendanceSummary,
    )
    cy.stubEndpoint('GET', '/scheduled-instances/93', getScheduledInstance)
    cy.stubEndpoint('GET', '/scheduled-instances/93/scheduled-attendees', getAttendeesForScheduledInstance)
    cy.stubEndpoint('POST', `/scheduled-events/prison/MDI\\?date=${today}`, getScheduledEvents)
    cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', getInmateDetails)
    cy.stubEndpoint('PUT', '/attendances')
    cy.stubEndpoint('GET', '/activity-categories', getCategories)
    cy.stubEndpoint('PUT', '/scheduled-instances/93/cancel')
    cy.stubEndpoint('PUT', '/scheduled-instances/93/uncancel')
    cy.stubEndpoint('GET', '/api/agencies/MDI/eventLocations', getEventLocations)
  })

  it('should click through record attendance journey', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.activitiesCard().click()

    const activitiesIndexPage = Page.verifyOnPage(ActivitiesIndexPage)
    activitiesIndexPage.recordAttendanceCard().click()

    const recordAttendancePage = Page.verifyOnPage(AttendanceDashboardPage)
    recordAttendancePage.recordAttendanceCard().click()

    const selectPeriodPage = Page.verifyOnPage(SelectPeriodPage)
    selectPeriodPage.enterDate(new Date(today))
    selectPeriodPage.selectAM()
    selectPeriodPage.continue()

    const activitiesPage = Page.verifyOnPage(ActivitiesPage)
    activitiesPage.containsActivities('English level 1', 'English level 2', 'Football', 'Maths level 1')
    activitiesPage.back()

    Page.verifyOnPage(SelectPeriodPage)
    selectPeriodPage.enterDate(new Date(today))
    selectPeriodPage.selectPM()
    selectPeriodPage.continue()

    activitiesPage.containsActivities('English level 1', 'English level 2', 'Football', 'Gym', 'Maths level 1')
    activitiesPage.selectActivityWithName('English level 1')

    const attendanceListPage = Page.verifyOnPage(AttendanceListPage)
    attendanceListPage.checkClashingEventsStatuses('Aborah, Cudmastarie', 'Attended', 'Paid')
    attendanceListPage.checkAttendanceStatuses('Andy, Booking', 'Attended', 'Pay')
    attendanceListPage.checkClashingEventsStatuses('Andy, Booking', 'Paid', 'Did not attend')
    attendanceListPage.selectPrisoner('Aborah, Cudmastarie')
    attendanceListPage.selectPrisoner('Arianniver, Eeteljan')
    attendanceListPage.markAsAttended()
    Page.verifyOnPage(AttendanceListPage)

    attendanceListPage.cancelSessionButton().click()
    cy.stubEndpoint('GET', '/scheduled-instances/93', getCancelledScheduledInstance)

    const cancelSessionReasonPage = Page.verifyOnPage(CancelSessionReason)
    cancelSessionReasonPage.selectReason('Location unavailable')
    cancelSessionReasonPage.moreDetailsInput().type('Location in use')
    cancelSessionReasonPage.continue()

    const cancelSessionConfirmPage = Page.verifyOnPage(CancelSessionConfirm)
    cancelSessionConfirmPage.selectConfirmation('Yes')
    cancelSessionConfirmPage.confirm()

    Page.verifyOnPage(AttendanceListPage)
    attendanceListPage.checkAttendanceStatuses('Andy, Booking', 'Cancelled', 'Pay')
    attendanceListPage.checkAttendanceStatuses('Aisho, Egurztof', 'Cancelled', 'Pay')
    attendanceListPage.assertNotificationContents(
      'Session cancelled',
      'This activity session has been cancelled by USER1 - J. Smith on Thursday, 2 February 2023 for the following reason:',
      'Location unavailable - this is a comment',
    )

    attendanceListPage.getLinkByText('Uncancel this session').click()

    cy.stubEndpoint('GET', '/scheduled-instances/93', getScheduledInstance)

    const uncancelSessionConfirmPage = Page.verifyOnPage(UncancelSessionConfirm)
    uncancelSessionConfirmPage.selectReason('Yes')
    uncancelSessionConfirmPage.confirm()

    Page.verifyOnPage(AttendanceListPage)
    attendanceListPage.assertNotificationContents('Session no longer cancelled')
  })
})
