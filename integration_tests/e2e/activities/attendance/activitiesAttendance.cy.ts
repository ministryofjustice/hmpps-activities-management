import { format, startOfToday } from 'date-fns'
import IndexPage from '../../../pages'
import Page from '../../../pages/page'
import getAllAttendances from '../../../fixtures/activitiesApi/getAllAttendances.json'
import getActivityCategories from '../../../fixtures/activitiesApi/getActivityCategories.json'
import ActivitiesIndexPage from '../../../pages/activities'
import SelectPeriodPage from '../../../pages/activities/attendanceSummary/selectPeriod'
import DailySummaryPage from '../../../pages/activities/attendanceSummary/dailySummary'
import AttendancePage from '../../../pages/activities/attendanceSummary/attendance'
import AttendanceDashboardPage from '../../../pages/recordAttendance/attendanceDashboard'
import ActivitiesPage from '../../../pages/recordAttendance/activitiesPage'
import getAttendanceSummary from '../../../fixtures/activitiesApi/getAttendanceSummary.json'
import getEventLocations from '../../../fixtures/prisonApi/getEventLocations.json'

const inmateDetails = [
  {
    prisonerNumber: 'G4479GS',
    firstName: 'BOOKING',
    lastName: 'ANDY',
  },
  {
    prisonerNumber: 'G4479GQ',
    firstName: 'EGURZTOF',
    lastName: 'AISHO',
  },
]

context('Daily Attendance', () => {
  const today = format(startOfToday(), 'yyyy-MM-dd')

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.signIn()
    cy.stubEndpoint('GET', `/attendances/MDI/${today}`, getAllAttendances)
    cy.stubEndpoint('GET', `/attendances/MDI/${today}\\?eventTier=TIER_2`, getAllAttendances)
    cy.stubEndpoint('GET', `/attendances/MDI/${today}\\?eventTier=TIER_1`, getAllAttendances)
    cy.stubEndpoint('GET', `/attendances/MDI/${today}\\?eventTier=FOUNDATION`, getAllAttendances)
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
    cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', inmateDetails)
  })

  it('should display the correct counts on the summary page', () => {
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
    dailySummaryPage.tier1AttendanceStat().contains(0)
    dailySummaryPage.tier2AttendanceStat().contains(2)
    dailySummaryPage.routineAttendanceStat().contains(1)
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
    activitiesPage.assertRow(1, true, 'English level 1', 'Education 2', '09:00 to 10:00', '5', '2', '1', '1')
    activitiesPage.assertRow(2, true, 'English level 2', 'Education 1', '09:00 to 10:00', '10', '5', '2', '1')
    activitiesPage.assertRow(3, false, 'Football', 'Off wing', '09:00 to 09:45', '20', '-', '-', '-')
    activitiesPage.assertRow(4, false, 'Gym', 'Gym', '14:30 to 17:00', '16', '-', '-', '-')
    activitiesPage.assertRow(5, true, 'Maths level 1', 'B wing', '09:20 to 10:20', '18', '4', '2', '0')

    activitiesPage.sessionPMCheckbox().click()
    activitiesPage.getButton('Apply filters').eq(0).click()

    activitiesPage.assertRow(1, true, 'English level 1', 'Education 2', '09:00 to 10:00', '5', '2', '1', '1')
    activitiesPage.assertRow(2, true, 'English level 2', 'Education 1', '09:00 to 10:00', '10', '5', '2', '1')
    activitiesPage.assertRow(3, false, 'Football', 'Off wing', '09:00 to 09:45', '20', '-', '-', '-')
    activitiesPage.assertRow(4, true, 'Maths level 1', 'B wing', '09:20 to 10:20', '18', '4', '2', '0')
  })

  it('has the correct title for tier pages', () => {
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
    dailySummaryPage.selectTier2AttendanceLink()
    const attendancePage = Page.verifyOnPage(AttendancePage)

    attendancePage.title().contains('All Tier 2 attendances')
    attendancePage.getButton('Show filter').click()
    attendancePage.absenceRadios().should('not.exist')
    attendancePage.payRadios().should('not.exist')
    attendancePage.categoriesRadios().should('exist')

    attendancePage.back()
    dailySummaryPage.selectTier1AttendanceLink()
    attendancePage.title().contains('All Tier 1 attendances')
    attendancePage.back()
    dailySummaryPage.selectRoutineAttendanceLink()
    attendancePage.title().contains('All routine attendances')
  })
  it('Absences page - filter on absence reason', () => {
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
    dailySummaryPage.absencesLink()

    const attendancePage = Page.verifyOnPage(AttendancePage)
    attendancePage.title().contains('All absences')
    attendancePage.count().contains('3 absences')

    attendancePage.getButton('Show filter').click()
    attendancePage.absenceRadios().should('exist')
    attendancePage.payRadios().should('exist')
    attendancePage.categoriesRadios().should('exist')

    attendancePage.clearAbsenceReasons()
    attendancePage.absenceRadios().find('input[value="REST"]').check()
    attendancePage.getButton('Apply filters').first().click()

    attendancePage.count().contains('1 absence')
    cy.get('[data-qa="attendance"]').contains('Rest day')
  })
  it('Absences page - filter on pay', () => {
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
    dailySummaryPage.absencesLink()

    const attendancePage = Page.verifyOnPage(AttendancePage)
    attendancePage.title().contains('All absences')
    attendancePage.count().contains('3 absences')

    attendancePage.getButton('Show filter').click()
    attendancePage.payRadios().find('input[value="PAID"]').should('be.checked')
    attendancePage.payRadios().find('input[value="NO_PAY"]').should('be.checked')

    attendancePage.payRadios().find('input[value="NO_PAY"]').uncheck()
    attendancePage.getButton('Apply filters').first().click()

    attendancePage.count().contains('2 absences')
    attendancePage.payRadios().find('input[value="PAID"]').should('be.checked')
    attendancePage.payRadios().find('input[value="NO_PAY"]').should('not.be.checked')
    cy.get('[data-qa="attendance"]').should('not.contain.text', 'No pay')
  })
})
