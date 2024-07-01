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
import getScheduledInstance from '../../../fixtures/activitiesApi/getScheduledInstance94.json'
import getAttendeesForScheduledInstance from '../../../fixtures/activitiesApi/getAttendeesScheduledInstance94.json'
import getCancelledScheduledInstance from '../../../fixtures/activitiesApi/getScheduledInstance-cancelled94.json'
import getScheduledEvents from '../../../fixtures/activitiesApi/getScheduledEventsMdi20230202.json'
import getInmateDetails from '../../../fixtures/prisonerSearchApi/getInmateDetailsForAttendance.json'
import getCategories from '../../../fixtures/activitiesApi/getCategories.json'
import AttendanceDashboardPage from '../../../pages/recordAttendance/attendanceDashboard'
import ActivitiesIndexPage from '../../../pages/activities'
import getEventLocations from '../../../fixtures/prisonApi/getEventLocations.json'

context('Attendance not required', () => {
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
    cy.stubEndpoint('GET', '/scheduled-instances/94', getScheduledInstance)
    cy.stubEndpoint('GET', '/scheduled-instances/94/scheduled-attendees', getAttendeesForScheduledInstance)
    cy.stubEndpoint('POST', `/scheduled-events/prison/MDI\\?date=${today}`, getScheduledEvents)
    cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', getInmateDetails)
    cy.stubEndpoint('PUT', '/attendances')
    cy.stubEndpoint('GET', '/activity-categories', getCategories)
    cy.stubEndpoint('PUT', '/scheduled-instances/94/cancel')
    cy.stubEndpoint('PUT', '/scheduled-instances/94/uncancel')
    cy.stubEndpoint('GET', '/api/agencies/MDI/eventLocations', getEventLocations)
  })

  it('should not display attendance journey options and information', () => {
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
    activitiesPage.selectActivityWithName('Football')

    const attendanceListPage = Page.verifyOnPage(AttendanceListPage)
    attendanceListPage.checkAttendanceStatus('Andy, Booking', 'Not required')
    attendanceListPage.checkAttendanceStatus('Aborah, Cudmastarie', 'Not required')

    attendanceListPage.cancelSessionButton().click()
    cy.stubEndpoint('GET', '/scheduled-instances/94', getCancelledScheduledInstance)

    const cancelSessionReasonPage = Page.verifyOnPage(CancelSessionReason)
    cancelSessionReasonPage.caption()
    cancelSessionReasonPage.selectReason('Location unavailable')
    cancelSessionReasonPage.moreDetailsInput().type('Location in use')
    cancelSessionReasonPage.continue()

    const cancelSessionConfirmPage = Page.verifyOnPage(CancelSessionConfirm)
    cancelSessionConfirmPage.selectConfirmation('Yes')
    cancelSessionConfirmPage.confirm()

    Page.verifyOnPage(AttendanceListPage)
    attendanceListPage.checkAttendanceStatus('Andy, Booking', 'Not required')
    attendanceListPage.checkAttendanceStatus('Aisho, Egurztof', 'Not required')
    attendanceListPage.assertNotificationContents(
      'Session cancelled',
      'This activity session has been cancelled by USER1 - J. Smith on Thursday, 2 February 2023 for the following reason:',
      'Location unavailable',
    )

    attendanceListPage.getLinkByText('Uncancel this session').click()

    cy.stubEndpoint('GET', '/scheduled-instances/94', getScheduledInstance)

    const uncancelSessionConfirmPage = Page.verifyOnPage(UncancelSessionConfirm)
    uncancelSessionConfirmPage.selectReason('Yes')
    uncancelSessionConfirmPage.confirm()

    Page.verifyOnPage(AttendanceListPage)
    attendanceListPage.assertNotificationContents('Session no longer cancelled')
  })
})
