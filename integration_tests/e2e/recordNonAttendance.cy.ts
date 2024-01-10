import IndexPage from '../pages/index'
import Page from '../pages/page'
import SelectPeriodPage from '../pages/recordAttendance/selectPeriod'
import ActivitiesPage from '../pages/recordAttendance/activitiesPage'
import AttendanceListPage from '../pages/recordAttendance/attendanceList'
import getAttendanceReasons from '../fixtures/activitiesApi/getAttendanceReasons.json'
import getScheduledInstance from '../fixtures/activitiesApi/getScheduledInstance93.json'
import getAttendeesForScheduledInstance from '../fixtures/activitiesApi/getAttendeesScheduledInstance93.json'
import getScheduledEvents from '../fixtures/activitiesApi/getScheduledEventsMdi20230202.json'
import getInmateDetails from '../fixtures/prisonApi/getInmateDetailsForNonAttendance.json'
import NotAttendedReasonPage from '../pages/recordAttendance/notAttendedReason'
import getCategories from '../fixtures/activitiesApi/getCategories.json'
import getAttendanceSummary from '../fixtures/activitiesApi/getAttendanceSummary.json'
import AttendanceDashboardPage from '../pages/recordAttendance/attendanceDashboard'
import ActivitiesIndexPage from '../pages/activities'

context('Record non attendance', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.signIn()

    cy.stubEndpoint(
      'GET',
      `/scheduled-instances/attendance-summary\\?prisonCode=MDI&date=2023-02-02`,
      getAttendanceSummary,
    )
    cy.stubEndpoint('GET', '/scheduled-instances/93', getScheduledInstance)
    cy.stubEndpoint('GET', '/scheduled-instances/93/scheduled-attendees', getAttendeesForScheduledInstance)
    cy.stubEndpoint('POST', '/scheduled-events/prison/MDI\\?date=2023-02-02', getScheduledEvents)
    cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', getInmateDetails)
    cy.stubEndpoint('PUT', '/attendances')
    cy.stubEndpoint('GET', '/attendance-reasons', getAttendanceReasons)
    cy.stubEndpoint('GET', '/activity-categories', getCategories)
  })

  it('should click through record non attendance journey', () => {
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
    selectPeriodPage.enterDate(new Date(2023, 1, 2))
    selectPeriodPage.continue()

    const activitiesPage = Page.verifyOnPage(ActivitiesPage)
    activitiesPage.activityRows().should('have.length', 4)
    activitiesPage.selectActivityWithName('English level 1')

    const attendanceListPage = Page.verifyOnPage(AttendanceListPage)
    attendanceListPage.selectPrisoner('Aborah, Cudmastarie')
    attendanceListPage.selectPrisoner('Arianniver, Eeteljan')
    attendanceListPage.markAsNotAttended()

    const notAttendedReasonPage = Page.verifyOnPage(NotAttendedReasonPage)
    notAttendedReasonPage.selectRadio('notAttendedData[0][notAttendedReason]')
    notAttendedReasonPage.selectRadio('notAttendedData[0][sickPay]')
    notAttendedReasonPage.selectRadio('notAttendedData[1][notAttendedReason]')
    notAttendedReasonPage.selectRadio('notAttendedData[1][sickPay]')
    notAttendedReasonPage.submit()

    Page.verifyOnPage(AttendanceListPage)
  })
})
