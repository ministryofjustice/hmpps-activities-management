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
import CancelSingleReasonPage from '../../../pages/recordAttendance/cancelSingleReason'
import CancelSinglePaymentPage from '../../../pages/recordAttendance/cancelSinglePayment'
import CancelSingleCheckAnswersPage from '../../../pages/recordAttendance/cancelSingleCheckAnswers'

context('Cancel Single Session', () => {
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
    cy.stubEndpoint('GET', '/scheduled-instances/93', getScheduledInstanceEnglishLevel1)
    cy.stubEndpoint('GET', '/scheduled-instances/11', getScheduledInstanceEnglishLevel2)
    cy.stubEndpoint('PUT', '/scheduled-instances/93/cancel')
    cy.stubEndpoint('PUT', '/scheduled-instances/11/cancel')
  })

  it('Should cancel single paid activity with pay', () => {
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
    activitiesPage.selectActivitiesWithNames('English level 2')
    activitiesPage.cancelSessions()

    const cancelSingleReasonPage = Page.verifyOnPage(CancelSingleReasonPage)
    cancelSingleReasonPage
      .caption()
      .contains('This will be recorded as an acceptable absence for everyone who was due to attend.')

    cancelSingleReasonPage.selectReason('Location unavailable')
    cancelSingleReasonPage.moreDetailsInput().type('Location in use')
    cancelSingleReasonPage.continue()

    const cancelSinglePaymentPage = Page.verifyOnPage(CancelSinglePaymentPage)

    cancelSinglePaymentPage.issuePayment('Yes')
    cancelSinglePaymentPage.continue()

    const cancelSingleCheckAnswersPage = Page.verifyOnPage(CancelSingleCheckAnswersPage)

    cancelSingleCheckAnswersPage.assertCancellationDetail('Activity', 'English level 2')
    cancelSingleCheckAnswersPage.assertCancellationDetail('Cancellation reason', 'Location unavailable')
    cancelSingleCheckAnswersPage.assertCancellationDetail('Will people be paid?', 'Yes')

    cancelSingleCheckAnswersPage.confirmCancellationButton().click()
    Page.verifyOnPage(ActivitiesPage)
  })

  it('Should cancel single paid activity without pay', () => {
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
    activitiesPage.selectActivitiesWithNames('English level 2')
    activitiesPage.cancelSessions()

    const cancelSingleReasonPage = Page.verifyOnPage(CancelSingleReasonPage)
    cancelSingleReasonPage
      .caption()
      .contains('This will be recorded as an acceptable absence for everyone who was due to attend.')

    cancelSingleReasonPage.selectReason('Location unavailable')
    cancelSingleReasonPage.moreDetailsInput().type('Location in use')
    cancelSingleReasonPage.continue()

    const cancelSinglePaymentPage = Page.verifyOnPage(CancelSinglePaymentPage)

    cancelSinglePaymentPage.issuePayment('No')
    cancelSinglePaymentPage.continue()

    const cancelSingleCheckAnswersPage = Page.verifyOnPage(CancelSingleCheckAnswersPage)

    cancelSingleCheckAnswersPage.assertCancellationDetail('Activity', 'English level 2')
    cancelSingleCheckAnswersPage.assertCancellationDetail('Cancellation reason', 'Location unavailable')
    cancelSingleCheckAnswersPage.assertCancellationDetail('Will people be paid?', 'No')

    cancelSingleCheckAnswersPage.confirmCancellationButton().click()
    Page.verifyOnPage(ActivitiesPage)
  })

  it('Should cancel single unpaid activity', () => {
    getScheduledInstanceEnglishLevel1.activitySchedule.activity.paid = false
    getScheduledInstanceEnglishLevel2.activitySchedule.activity.paid = false

    cy.stubEndpoint('POST', '/scheduled-instances', [
      getScheduledInstanceEnglishLevel1,
      getScheduledInstanceEnglishLevel2,
    ])

    cy.stubEndpoint('GET', '/scheduled-instances/93', getScheduledInstanceEnglishLevel1)

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
    activitiesPage.selectActivitiesWithNames('English level 1')
    activitiesPage.cancelSessions()

    const cancelSingleReasonPage = Page.verifyOnPage(CancelSingleReasonPage)
    cancelSingleReasonPage
      .caption()
      .contains('This will be recorded as an acceptable absence for everyone who was due to attend.')

    cancelSingleReasonPage.selectReason('Location unavailable')
    cancelSingleReasonPage.moreDetailsInput().type('Location in use')
    cancelSingleReasonPage.continue()

    const cancelSingleCheckAnswersPage = Page.verifyOnPage(CancelSingleCheckAnswersPage)

    cancelSingleCheckAnswersPage.assertCancellationDetail('Activity', 'English level 1')
    cancelSingleCheckAnswersPage.assertCancellationDetail('Cancellation reason', 'Location unavailable')
    cancelSingleCheckAnswersPage.assertCancellationDetail('Will people be paid?', 'No')

    cancelSingleCheckAnswersPage.confirmCancellationButton().click()
    Page.verifyOnPage(ActivitiesPage)
  })
})
