import { format, startOfToday } from 'date-fns'
import IndexPage from '../../pages'
import Page from '../../pages/page'
import getAllAttendances from '../../fixtures/activitiesApi/getAllAttendances.json'
import getActivityCategories from '../../fixtures/activitiesApi/getActivityCategories.json'
import ActivitiesIndexPage from '../../pages/activities'
import SelectPeriodPage from '../../pages/activities/attendanceSummary/selectPeriod'
import DailySummaryPage from '../../pages/activities/attendanceSummary/dailySummary'
import AttendanceDashboardPage from '../../pages/recordAttendance/attendanceDashboard'
import ActivitiesPage from '../../pages/activities/attendanceSummary/activities'
import getAttendanceSummary from '../../fixtures/activitiesApi/getAttendanceSummary.json'

context('Daily Attendance', () => {
  const today = format(startOfToday(), 'yyyy-MM-dd')

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.signIn()
    cy.stubEndpoint('GET', `/attendances/MDI/${today}`, getAllAttendances)
    cy.stubEndpoint(
      'GET',
      `/prisons/MDI/scheduled-instances\\?startDate=${today}&endDate=${today}&cancelled=true`,
      JSON.parse('[]'),
    )
    cy.stubEndpoint('GET', `/activity-categories`, getActivityCategories)
    cy.stubEndpoint(
      'GET',
      `/scheduled-instances/attendance-summary\\?prisonCode=MDI&date=${today}`,
      getAttendanceSummary,
    )
  })

  it('should click through create activity journey', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.activitiesCard().should('contain.text', 'Activities, unlock and attendance')
    indexPage.activitiesCard().click()

    const activitiesIndexPage = Page.verifyOnPage(ActivitiesIndexPage)
    activitiesIndexPage.recordAttendanceCard().should('contain.text', 'Record activity attendance')
    activitiesIndexPage.recordAttendanceCard().click()

    const recordAttendancePage = Page.verifyOnPage(AttendanceDashboardPage)
    recordAttendancePage.attendanceSummaryCard().should('contain.text', 'View daily attendance summary')
    recordAttendancePage.attendanceSummaryCard().click()

    const selectPeriodPage = Page.verifyOnPage(SelectPeriodPage)
    selectPeriodPage.selectToday()
    selectPeriodPage.continue()

    const dailySummaryPage = Page.verifyOnPage(DailySummaryPage)
    dailySummaryPage.selectSessionsLink()

    const activitiesPage = Page.verifyOnPage(ActivitiesPage)
    activitiesPage.assertRow('am', 'English level 1', '5', '2', '2', '1')
    // Non-attended should have hyphens for Attended, Not recorded and All absences
    activitiesPage.assertRow('am', 'Football', '5', '-', '-', '-')
  })
})
