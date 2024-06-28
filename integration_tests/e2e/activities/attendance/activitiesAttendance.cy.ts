import { format, startOfToday } from 'date-fns'
import IndexPage from '../../../pages'
import Page from '../../../pages/page'
import getAllAttendances from '../../../fixtures/activitiesApi/getAllAttendances.json'
import getActivityCategories from '../../../fixtures/activitiesApi/getActivityCategories.json'
import ActivitiesIndexPage from '../../../pages/activities'
import SelectPeriodPage from '../../../pages/activities/attendanceSummary/selectPeriod'
import DailySummaryPage from '../../../pages/activities/attendanceSummary/dailySummary'
import AttendanceDashboardPage from '../../../pages/recordAttendance/attendanceDashboard'
import ActivitiesPage from '../../../pages/recordAttendance/activitiesPage'
import getAttendanceSummary from '../../../fixtures/activitiesApi/getAttendanceSummary.json'
import getEventLocations from '../../../fixtures/prisonApi/getEventLocations.json'

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
    cy.stubEndpoint('GET', '/api/agencies/MDI/eventLocations', getEventLocations)
  })

  it('should click through create activity journey', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.activitiesCard().click()

    const activitiesIndexPage = Page.verifyOnPage(ActivitiesIndexPage)
    activitiesIndexPage.recordAttendanceCard().click()

    const recordAttendancePage = Page.verifyOnPage(AttendanceDashboardPage)
    recordAttendancePage.attendanceSummaryCard().click()

    const selectPeriodPage = Page.verifyOnPage(SelectPeriodPage)
    selectPeriodPage.selectToday()
    selectPeriodPage.continue()

    const dailySummaryPage = Page.verifyOnPage(DailySummaryPage)
    dailySummaryPage.selectSessionsLink()

    const activitiesPage = Page.verifyOnPage(ActivitiesPage)
    activitiesPage.assertRow(1, true, 'English level 1', 'Education 2', 'AM', '5', '2', '1', '1')
    activitiesPage.assertRow(2, true, 'English level 2', 'Education 1', 'AM', '10', '5', '2', '1')
    activitiesPage.assertRow(3, false, 'Football', 'Off wing', 'AM', '20', '-', '-', '-')
    activitiesPage.assertRow(4, false, 'Gym', 'Gym', 'PM', '16', '-', '-', '-')
    activitiesPage.assertRow(5, true, 'Maths level 1', 'B wing', 'AM', '18', '4', '2', '0')

    activitiesPage.sessionPMCheckbox().click()
    activitiesPage.getButton('Apply filters').eq(0).click()

    activitiesPage.assertRow(1, true, 'English level 1', 'Education 2', 'AM', '5', '2', '1', '1')
    activitiesPage.assertRow(2, true, 'English level 2', 'Education 1', 'AM', '10', '5', '2', '1')
    activitiesPage.assertRow(3, false, 'Football', 'Off wing', 'AM', '20', '-', '-', '-')
    activitiesPage.assertRow(4, true, 'Maths level 1', 'B wing', 'AM', '18', '4', '2', '0')
  })
})
