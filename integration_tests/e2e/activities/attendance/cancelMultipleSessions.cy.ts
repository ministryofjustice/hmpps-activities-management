import { format, startOfToday } from 'date-fns'
import IndexPage from '../../../pages'
import Page from '../../../pages/page'
import SelectPeriodPage from '../../../pages/recordAttendance/selectPeriod'
import ActivitiesPage from '../../../pages/recordAttendance/activitiesPage'
import getScheduledInstanceEnglishLevel1 from '../../../fixtures/activitiesApi/getScheduledInstance93.json'
import getScheduledInstanceEnglishLevel2 from '../../../fixtures/activitiesApi/getScheduledInstance11.json'
import AttendanceDashboardPage from '../../../pages/recordAttendance/attendanceDashboard'
import ActivitiesIndexPage from '../../../pages/activities'
import getAttendanceSummary from '../../../fixtures/activitiesApi/getAttendanceSummary-11-93-94.json'
import getCategories from '../../../fixtures/activitiesApi/getCategories.json'
import getEventLocations from '../../../fixtures/prisonApi/getEventLocations.json'
import getAttendanceReasons from '../../../fixtures/activitiesApi/getAttendanceReasons.json'
import CancelMultipleReasonPage from '../../../pages/recordAttendance/cancelMultipleReason'
import CancelMultiplePaymentPage from '../../../pages/recordAttendance/cancelMultiplePayment'
import CancelMultipleCheckAnswersPage from '../../../pages/recordAttendance/cancelMultipleCheckAnswers'

context('Record attendance', () => {
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
    cancelMultipleReasonPage.caption()

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
    cancelMultipleReasonPage.caption()

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
