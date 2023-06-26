import { format, startOfToday } from 'date-fns'
import IndexPage from '../pages/index'
import Page from '../pages/page'
import SelectPeriodPage from '../pages/recordAttendance/selectPeriod'
import ActivitiesPage from '../pages/recordAttendance/activitiesPage'
import AttendanceListPage from '../pages/recordAttendance/attendanceList'
import CancelSessionReason from '../pages/recordAttendance/cancelSessionReason'
import CancelSessionConfirm from '../pages/recordAttendance/cancelSessionConfirm'
import UncancelSessionConfirm from '../pages/recordAttendance/uncancelSessionConfirm'
import getScheduledInstances from '../fixtures/activitiesApi/getScheduledInstancesMdi20230202.json'
import getScheduledInstance from '../fixtures/activitiesApi/getScheduledInstance93.json'
import getCancelledScheduledInstance from '../fixtures/activitiesApi/getScheduledInstance-cancelled.json'
import getScheduledEvents from '../fixtures/activitiesApi/getScheduledEventsMdi20230202.json'
import getInmateDetails from '../fixtures/prisonApi/getInmateDetailsForAttendance.json'
import getCategories from '../fixtures/activitiesApi/getCategories.json'
import AttendanceDashboardPage from '../pages/recordAttendance/attendanceDashboard'
import ActivitiesIndexPage from '../pages/activities'

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
      `/prisons/MDI/scheduled-instances\\?startDate=${today}&endDate=${today}`,
      getScheduledInstances,
    )
    cy.stubEndpoint('GET', '/scheduled-instances/93', getScheduledInstance)
    cy.stubEndpoint('POST', `/scheduled-events/prison/MDI\\?date=${today}`, getScheduledEvents)
    cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', getInmateDetails)
    cy.stubEndpoint('PUT', '/attendances')
    cy.stubEndpoint('GET', '/activity-categories', getCategories)
    cy.stubEndpoint('PUT', '/scheduled-instances/93/cancel')
    cy.stubEndpoint('PUT', '/scheduled-instances/93/uncancel')
  })

  it('should click through record attendance journey', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.activitiesCard().should('contain.text', 'Allocate people, unlock and attend')
    indexPage.activitiesCard().click()

    const activitiesIndexPage = Page.verifyOnPage(ActivitiesIndexPage)
    activitiesIndexPage.recordAttendanceCard().should('contain.text', 'Record activity attendance')
    activitiesIndexPage.recordAttendanceCard().click()

    const recordAttendancePage = Page.verifyOnPage(AttendanceDashboardPage)
    recordAttendancePage.recordAttendanceCard().should('contain.text', 'Record attendance and cancel activity sessions')
    recordAttendancePage.recordAttendanceCard().click()

    const selectPeriodPage = Page.verifyOnPage(SelectPeriodPage)
    selectPeriodPage.enterDate(today)
    selectPeriodPage.submit()

    const activitiesPage = Page.verifyOnPage(ActivitiesPage)
    activitiesPage.activityRows().should('have.length', 4)
    activitiesPage.selectActivityWithName('English level 1')

    const attendanceListPage = Page.verifyOnPage(AttendanceListPage)
    attendanceListPage.checkAttendanceStatus('Booking Andy', 'Attended')
    attendanceListPage.checkAttendanceStatus('Booking Andy', 'Pay')
    attendanceListPage.selectPrisoner('Cudmastarie Aborah')
    attendanceListPage.selectPrisoner('Eeteljan Arianniver')
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
    cancelSessionConfirmPage.continue()

    Page.verifyOnPage(AttendanceListPage)
    attendanceListPage.checkAttendanceStatus('Booking Andy', 'Cancelled')
    attendanceListPage.checkAttendanceStatus('Booking Andy', 'Pay')
    attendanceListPage.checkAttendanceStatus('Egurztof Aisho', 'Cancelled')
    attendanceListPage.checkAttendanceStatus('Egurztof Aisho', 'Pay')
    attendanceListPage.assertNotificationContents(
      'Session cancelled',
      'This activity session has been cancelled for the following reason:',
    )

    attendanceListPage.getLinkByText('Uncancel this session').click()

    cy.stubEndpoint('GET', '/scheduled-instances/93', getScheduledInstance)

    const uncancelSessionConfirmPage = Page.verifyOnPage(UncancelSessionConfirm)
    uncancelSessionConfirmPage.selectReason('Yes')
    uncancelSessionConfirmPage.continue()

    Page.verifyOnPage(AttendanceListPage)
    attendanceListPage.assertNotificationContents('Session no longer cancelled')
  })
})
