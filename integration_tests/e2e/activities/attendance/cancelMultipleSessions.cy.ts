import { format, startOfToday } from 'date-fns'
import IndexPage from '../../../pages'
import Page from '../../../pages/page'
import SelectPeriodPage from '../../../pages/recordAttendance/selectPeriod'
import ActivitiesPage from '../../../pages/recordAttendance/activitiesPage'
import getScheduledInstanceEnglishLevel1 from '../../../fixtures/activitiesApi/getScheduledInstance93.json'
import getScheduledInstanceEnglishLevel1Cancelled from '../../../fixtures/activitiesApi/getScheduledInstance-cancelled.json'
import getScheduledInstanceEnglishLevel2 from '../../../fixtures/activitiesApi/getScheduledInstance11.json'
import getAttendeesForScheduledInstance from '../../../fixtures/activitiesApi/getAttendeesScheduledInstance93.json'
import getScheduledEvents from '../../../fixtures/activitiesApi/getScheduledEventsMdi20230202.json'
import getInmateDetails from '../../../fixtures/prisonerSearchApi/getInmateDetailsForAttendance.json'
import AttendanceDashboardPage from '../../../pages/recordAttendance/attendanceDashboard'
import UncancelSessionConfirm from '../../../pages/recordAttendance/uncancelSessionConfirm'
import ActivitiesIndexPage from '../../../pages/activities'
import getAttendanceSummary from '../../../fixtures/activitiesApi/getAttendanceSummary-11-93-94.json'
import getAttendanceSummaryCancelled from '../../../fixtures/activitiesApi/getAttendanceSummary-11-93-94-cancelled.json'
import getCategories from '../../../fixtures/activitiesApi/getCategories.json'
import getEventLocations from '../../../fixtures/prisonApi/getEventLocations.json'
import getAttendanceReasons from '../../../fixtures/activitiesApi/getAttendanceReasons.json'
import CancelMultipleReasonPage from '../../../pages/recordAttendance/cancelMultipleReason'
import CancelMultiplePaymentPage from '../../../pages/recordAttendance/cancelMultiplePayment'
import CancelMultipleCheckAnswersPage from '../../../pages/recordAttendance/cancelMultipleCheckAnswers'
import AttendanceListPage from '../../../pages/recordAttendance/attendanceList'
import ViewOrEditCancellationDetailsPage from '../../../pages/recordAttendance/viewOrEditCancellationDetails'
import CancelSessionPage from '../../../pages/recordAttendance/cancelSessionReason'
import UpdateCancelledSessionPayPage from '../../../pages/recordAttendance/cancelSessionPay'

context('Cancel Multiple Sessions', () => {
  const today = startOfToday()
  const todayStr = format(today, 'yyyy-MM-dd')

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.signIn()

    getScheduledInstanceEnglishLevel1.date = todayStr
    getScheduledInstanceEnglishLevel2.date = todayStr

    cy.stubEndpoint(
      'GET',
      `/scheduled-instances/attendance-summary\\?prisonCode=MDI&date=${todayStr}`,
      getAttendanceSummary,
    )
    cy.stubEndpoint('GET', '/activity-categories', getCategories)
    cy.stubEndpoint('GET', '/attendance-reasons', getAttendanceReasons)
    cy.stubEndpoint('GET', '/api/agencies/MDI/eventLocations', getEventLocations)
    cy.stubEndpoint('PUT', '/scheduled-instances/cancel')
  })

  it('Should cancel multiple paid activities', () => {
    cy.stubEndpoint('POST', '/scheduled-instances', [
      getScheduledInstanceEnglishLevel1,
      getScheduledInstanceEnglishLevel2,
    ])

    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.activitiesCard().click()

    const activitiesIndexPage = Page.verifyOnPage(ActivitiesIndexPage)
    activitiesIndexPage.recordAttendanceCard().click()

    const recordAttendancePage = Page.verifyOnPage(AttendanceDashboardPage)
    recordAttendancePage.recordAttendanceCard().click()

    const selectPeriodPage = Page.verifyOnPage(SelectPeriodPage)
    selectPeriodPage.enterDate(new Date(todayStr))
    selectPeriodPage.selectAM()
    selectPeriodPage.selectPM()
    selectPeriodPage.selectED()
    selectPeriodPage.continue()

    const activitiesPage = Page.verifyOnPage(ActivitiesPage)
    activitiesPage.containsActivities('English level 1', 'English level 2', 'Gym sports and fitness')
    activitiesPage.selectActivitiesWithNames('English level 1', 'English level 2')
    activitiesPage.cancelSessions()

    const cancelMultipleReasonPage = Page.verifyOnPage(CancelMultipleReasonPage)
    cancelMultipleReasonPage
      .caption()
      .contains('This will be recorded as an acceptable absence for everyone who was due to attend.')

    cancelMultipleReasonPage.selectReason('Location unavailable')
    cancelMultipleReasonPage.moreDetailsInput().type('Location in use')
    cancelMultipleReasonPage.continue()

    const cancelMultiplePaymentPage = Page.verifyOnPage(CancelMultiplePaymentPage)

    cancelMultiplePaymentPage.issuePayment('Yes')
    cancelMultiplePaymentPage.continue()

    const cancelMultipleCheckAnswersPage = Page.verifyOnPage(CancelMultipleCheckAnswersPage)

    cancelMultipleCheckAnswersPage.assertCancellationDetail("Sessions you're cancelling", '2')
    cancelMultipleCheckAnswersPage.assertCancellationDetail('Cancellation reason', 'Location unavailable')
    cancelMultipleCheckAnswersPage.assertCancellationDetail('Pay for cancelled sessions', 'Yes')

    cancelMultipleCheckAnswersPage.expandSessionsSummary()
    cancelMultipleCheckAnswersPage.checkSummaryTableHeader(`${format(today, 'EEEE, d MMMM yyyy')} - PM`)
    cancelMultipleCheckAnswersPage.assertSummaryTableRow(1, 'Entry level English 4 (PM)')
    cancelMultipleCheckAnswersPage.assertSummaryTableRow(2, 'English Level 2 (PM)')

    cancelMultipleCheckAnswersPage.confirmCancellationButton().click()
    Page.verifyOnPage(ActivitiesPage)
  })

  it('Should cancel multiple unpaid activities', () => {
    getScheduledInstanceEnglishLevel1.activitySchedule.activity.paid = false
    getScheduledInstanceEnglishLevel2.activitySchedule.activity.paid = false

    cy.stubEndpoint('POST', '/scheduled-instances', [
      getScheduledInstanceEnglishLevel1,
      getScheduledInstanceEnglishLevel2,
    ])

    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.activitiesCard().click()

    const activitiesIndexPage = Page.verifyOnPage(ActivitiesIndexPage)
    activitiesIndexPage.recordAttendanceCard().click()

    const recordAttendancePage = Page.verifyOnPage(AttendanceDashboardPage)
    recordAttendancePage.recordAttendanceCard().click()

    const selectPeriodPage = Page.verifyOnPage(SelectPeriodPage)
    selectPeriodPage.enterDate(new Date(todayStr))
    selectPeriodPage.selectAM()
    selectPeriodPage.selectPM()
    selectPeriodPage.selectED()
    selectPeriodPage.continue()

    const activitiesPage = Page.verifyOnPage(ActivitiesPage)
    activitiesPage.containsActivities('English level 1', 'English level 2', 'Gym sports and fitness')
    activitiesPage.selectActivitiesWithNames('English level 1', 'English level 2')
    activitiesPage.cancelSessions()

    const cancelMultipleReasonPage = Page.verifyOnPage(CancelMultipleReasonPage)
    cancelMultipleReasonPage
      .caption()
      .contains('This will be recorded as an acceptable absence for everyone who was due to attend.')

    cancelMultipleReasonPage.selectReason('Location unavailable')
    cancelMultipleReasonPage.moreDetailsInput().type('Location in use')
    cancelMultipleReasonPage.continue()

    const cancelMultipleCheckAnswersPage = Page.verifyOnPage(CancelMultipleCheckAnswersPage)

    cancelMultipleCheckAnswersPage.assertCancellationDetail("Sessions you're cancelling", '2')
    cancelMultipleCheckAnswersPage.assertCancellationDetail('Cancellation reason', 'Location unavailable')
    cancelMultipleCheckAnswersPage.assertCancellationDetail('Pay for cancelled sessions', 'No')

    cancelMultipleCheckAnswersPage.expandSessionsSummary()
    cancelMultipleCheckAnswersPage.checkSummaryTableHeader(`${format(today, 'EEEE, d MMMM yyyy')} - PM`)
    cancelMultipleCheckAnswersPage.assertSummaryTableRow(1, 'Entry level English 4 (PM)')
    cancelMultipleCheckAnswersPage.assertSummaryTableRow(2, 'English Level 2 (PM)')

    cancelMultipleCheckAnswersPage.confirmCancellationButton().click()
    Page.verifyOnPage(ActivitiesPage)
  })
})

context('Updating cancellation details', () => {
  const today = startOfToday()
  const todayStr = format(today, 'yyyy-MM-dd')

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.signIn()

    getScheduledInstanceEnglishLevel1.date = todayStr

    cy.stubEndpoint(
      'GET',
      `/scheduled-instances/attendance-summary\\?prisonCode=MDI&date=${todayStr}`,
      getAttendanceSummary,
    )
    cy.stubEndpoint('GET', '/activity-categories', getCategories)
    cy.stubEndpoint('GET', '/attendance-reasons', getAttendanceReasons)
    cy.stubEndpoint('GET', '/api/agencies/MDI/eventLocations', getEventLocations)
    cy.stubEndpoint('PUT', '/scheduled-instances/cancel')

    cy.stubEndpoint(
      'GET',
      `/scheduled-instances/attendance-summary\\?prisonCode=MDI&date=${todayStr}`,
      getAttendanceSummaryCancelled,
    )
    cy.stubEndpoint('GET', '/scheduled-instances/93/scheduled-attendees', getAttendeesForScheduledInstance)
    cy.stubEndpoint('POST', `/scheduled-events/prison/MDI\\?date=2023-02-02`, getScheduledEvents as unknown as JSON)
    cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', getInmateDetails as unknown as JSON)
    cy.stubEndpoint('PUT', '/scheduled-instances/93')
  })

  it('Should allow the user to update the cancellation details - unpaid activity', () => {
    getScheduledInstanceEnglishLevel1Cancelled.activitySchedule.activity.paid = false
    getScheduledInstanceEnglishLevel1Cancelled.attendances.forEach(cancelledAttendance => {
      const updated = cancelledAttendance
      updated.issuePayment = false
    })

    cy.stubEndpoint('GET', '/scheduled-instances/93', getScheduledInstanceEnglishLevel1Cancelled as unknown as JSON)

    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.activitiesCard().click()

    const activitiesIndexPage = Page.verifyOnPage(ActivitiesIndexPage)
    activitiesIndexPage.recordAttendanceCard().click()

    const recordAttendancePage = Page.verifyOnPage(AttendanceDashboardPage)
    recordAttendancePage.recordAttendanceCard().click()

    const selectPeriodPage = Page.verifyOnPage(SelectPeriodPage)
    selectPeriodPage.enterDate(new Date(todayStr))
    selectPeriodPage.selectAM()
    selectPeriodPage.continue()

    const activitiesPage = Page.verifyOnPage(ActivitiesPage)
    activitiesPage.selectActivityWithName('English level 1')

    const attendanceListPage = Page.verifyOnPage(AttendanceListPage)
    attendanceListPage.checkAttendanceStatuses('Aborah, Cudmastarie Hallone', 'Cancelled', 'Unpaid')
    attendanceListPage.checkAttendanceStatuses('Aisho, Egurztof', 'Cancelled', 'Unpaid')
    attendanceListPage.checkAttendanceStatuses('Andy, Booking', 'Cancelled', 'Unpaid')
    attendanceListPage.checkAttendanceStatuses('Arianniver, Eeteljan', 'Cancelled', 'Unpaid')
    attendanceListPage.assertNotificationContents(
      'Session cancelled',
      'This activity session has been cancelled by USER1 - J. Smith on Thursday, 2 February 2023 for the following reason:',
      'Location unavailable - this is a comment',
      'View or edit cancellation',
    )
    attendanceListPage.getLinkByText('View or edit cancellation').click()

    const viewOrEditCancellationDetailsPage = Page.verifyOnPage(ViewOrEditCancellationDetailsPage)
    viewOrEditCancellationDetailsPage.assertCancellationDetail('Reason', 'Location unavailable')
    viewOrEditCancellationDetailsPage.assertCancellationDetail('Cancelled by', 'USER1 - J. Smith')
    viewOrEditCancellationDetailsPage.getLinkByText('Change cancellation reason').click()

    const cancelSingleReasonPage = Page.verifyOnPage(CancelSessionPage)
    cancelSingleReasonPage.title().contains('Change the reason this session was cancelled')
    cancelSingleReasonPage
      .caption()
      .contains('This will be recorded as an acceptable absence for everyone who was due to attend.')
    cancelSingleReasonPage.selectReason('Session not required')
    cancelSingleReasonPage.moreDetailsInput().type('The prisoners are having a day off this activity.')
    cancelSingleReasonPage.getButton('Update cancellation reason').click()
    Page.verifyOnPage(ViewOrEditCancellationDetailsPage)
    viewOrEditCancellationDetailsPage.assertNotificationContents(
      'Session updated',
      "You've updated the reason for cancelling this session",
    )
  })
  it('Should show the user the correct cancellation details - paid activity, prisoners to be paid, but not editable', () => {
    getScheduledInstanceEnglishLevel1Cancelled.cancelledIssuePayment = true
    getScheduledInstanceEnglishLevel1Cancelled.activitySchedule.activity.paid = true

    cy.stubEndpoint('GET', '/scheduled-instances/93', getScheduledInstanceEnglishLevel1Cancelled as unknown as JSON)

    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.activitiesCard().click()

    const activitiesIndexPage = Page.verifyOnPage(ActivitiesIndexPage)
    activitiesIndexPage.recordAttendanceCard().click()

    const recordAttendancePage = Page.verifyOnPage(AttendanceDashboardPage)
    recordAttendancePage.recordAttendanceCard().click()

    const selectPeriodPage = Page.verifyOnPage(SelectPeriodPage)
    selectPeriodPage.enterDate(new Date(todayStr))
    selectPeriodPage.selectAM()
    selectPeriodPage.continue()

    const activitiesPage = Page.verifyOnPage(ActivitiesPage)
    activitiesPage.selectActivityWithName('English level 1')

    const attendanceListPage = Page.verifyOnPage(AttendanceListPage)
    attendanceListPage.getLinkByText('View or edit cancellation').click()

    const viewOrEditCancellationDetailsPage = Page.verifyOnPage(ViewOrEditCancellationDetailsPage)
    viewOrEditCancellationDetailsPage.assertCancellationDetail('Reason', 'Location unavailable')
    viewOrEditCancellationDetailsPage.assertCancellationDetail('Pay', 'Yes')
    viewOrEditCancellationDetailsPage.assertCancellationDetail('Cancelled by', 'USER1 - J. Smith')
  })
  it('Should show the user the correct cancellation details - paid activity, prisoners not to be paid', () => {
    getScheduledInstanceEnglishLevel1Cancelled.cancelledIssuePayment = false
    getScheduledInstanceEnglishLevel1Cancelled.activitySchedule.activity.paid = true
    getScheduledInstanceEnglishLevel1Cancelled.attendances.forEach(cancelledAttendance => {
      const updated = cancelledAttendance
      updated.issuePayment = false
    })

    cy.stubEndpoint('GET', '/scheduled-instances/93', getScheduledInstanceEnglishLevel1Cancelled as unknown as JSON)

    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.activitiesCard().click()

    const activitiesIndexPage = Page.verifyOnPage(ActivitiesIndexPage)
    activitiesIndexPage.recordAttendanceCard().click()

    const recordAttendancePage = Page.verifyOnPage(AttendanceDashboardPage)
    recordAttendancePage.recordAttendanceCard().click()

    const selectPeriodPage = Page.verifyOnPage(SelectPeriodPage)
    selectPeriodPage.enterDate(new Date(todayStr))
    selectPeriodPage.selectAM()
    selectPeriodPage.continue()

    const activitiesPage = Page.verifyOnPage(ActivitiesPage)
    activitiesPage.selectActivityWithName('English level 1')

    const attendanceListPage = Page.verifyOnPage(AttendanceListPage)
    attendanceListPage.getLinkByText('View or edit cancellation').click()

    const viewOrEditCancellationDetailsPage = Page.verifyOnPage(ViewOrEditCancellationDetailsPage)
    viewOrEditCancellationDetailsPage.assertCancellationDetail('Reason', 'Location unavailable')
    viewOrEditCancellationDetailsPage.assertCancellationDetail('Pay', 'No')
    viewOrEditCancellationDetailsPage.assertCancellationDetail('Cancelled by', 'USER1 - J. Smith')
  })
  it('Should allow the user to update whether the prisoners should be paid for the cancelled (paid) activity', () => {
    getScheduledInstanceEnglishLevel1Cancelled.date = todayStr
    getScheduledInstanceEnglishLevel1Cancelled.activitySchedule.activity.paid = true

    cy.stubEndpoint('GET', '/scheduled-instances/93', getScheduledInstanceEnglishLevel1Cancelled as unknown as JSON)
    cy.stubEndpoint('POST', `/scheduled-events/prison/MDI\\?date=${todayStr}`, getScheduledEvents as unknown as JSON)

    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.activitiesCard().click()

    const activitiesIndexPage = Page.verifyOnPage(ActivitiesIndexPage)
    activitiesIndexPage.recordAttendanceCard().click()

    const recordAttendancePage = Page.verifyOnPage(AttendanceDashboardPage)
    recordAttendancePage.recordAttendanceCard().click()

    const selectPeriodPage = Page.verifyOnPage(SelectPeriodPage)
    selectPeriodPage.enterDate(new Date(todayStr))
    selectPeriodPage.selectAM()
    selectPeriodPage.continue()

    const activitiesPage = Page.verifyOnPage(ActivitiesPage)
    activitiesPage.selectActivityWithName('English level 1')

    const attendanceListPage = Page.verifyOnPage(AttendanceListPage)
    attendanceListPage.assertNotificationContents(
      'Session cancelled',
      'This activity session has been cancelled by USER1 - J. Smith on Thursday, 2 February 2023 for the following reason:',
      'Location unavailable - this is a comment',
      'View or edit cancellation or uncancel this session',
    )
    attendanceListPage.getLinkByText('View or edit cancellation').click()

    const viewOrEditCancellationDetailsPage = Page.verifyOnPage(ViewOrEditCancellationDetailsPage)
    viewOrEditCancellationDetailsPage.assertCancellationDetail('Reason', 'Location unavailable')
    viewOrEditCancellationDetailsPage.assertCancellationDetail('Pay', 'No')
    viewOrEditCancellationDetailsPage.assertCancellationDetail('Cancelled by', 'USER1 - J. Smith')

    attendanceListPage.getLinkByText('Change pay').click()

    const updateCancelledSessionPayPage = Page.verifyOnPage(UpdateCancelledSessionPayPage)
    updateCancelledSessionPayPage.title().contains('Change if people should be paid for this cancelled session')
    updateCancelledSessionPayPage.getLinkByText('Do not change pay for this session').click()

    attendanceListPage.getLinkByText('Change pay').click()
    updateCancelledSessionPayPage.issuePayment('Yes')
    updateCancelledSessionPayPage.getButton('Update pay for this cancelled session').click()
    Page.verifyOnPage(ViewOrEditCancellationDetailsPage)
    viewOrEditCancellationDetailsPage.assertNotificationContents(
      'Session updated',
      "You've updated the pay for this session",
    )
  })
  it('Allows uncancel of a single session if the session was cancelled as part of a mass cancellation', () => {
    getScheduledInstanceEnglishLevel1Cancelled.date = todayStr

    cy.stubEndpoint('GET', '/scheduled-instances/93', getScheduledInstanceEnglishLevel1Cancelled as unknown as JSON)
    cy.stubEndpoint('POST', `/scheduled-events/prison/MDI\\?date=${todayStr}`, getScheduledEvents as unknown as JSON)
    cy.stubEndpoint('PUT', '/scheduled-instances/93/uncancel')

    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.activitiesCard().click()

    const activitiesIndexPage = Page.verifyOnPage(ActivitiesIndexPage)
    activitiesIndexPage.recordAttendanceCard().click()

    const recordAttendancePage = Page.verifyOnPage(AttendanceDashboardPage)
    recordAttendancePage.recordAttendanceCard().click()

    const selectPeriodPage = Page.verifyOnPage(SelectPeriodPage)
    selectPeriodPage.enterDate(new Date(todayStr))
    selectPeriodPage.selectAM()
    selectPeriodPage.continue()

    const activitiesPage = Page.verifyOnPage(ActivitiesPage)
    activitiesPage.selectActivityWithName('English level 1')

    const attendanceListPage = Page.verifyOnPage(AttendanceListPage)
    attendanceListPage.getLinkByText('uncancel this session').click()

    const uncancelSessionConfirmPage = Page.verifyOnPage(UncancelSessionConfirm)
    uncancelSessionConfirmPage.selectReason('Yes')
    uncancelSessionConfirmPage.confirm()
    Page.verifyOnPage(AttendanceListPage)
  })
})
