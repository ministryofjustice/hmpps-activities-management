import { format, startOfToday, startOfTomorrow } from 'date-fns'
import IndexPage from '../../../pages'
import Page from '../../../pages/page'
import SelectPeriodPage from '../../../pages/recordAttendance/selectPeriod'
import ActivitiesPage from '../../../pages/recordAttendance/activitiesPage'
import getScheduledInstanceEnglishLevel1 from '../../../fixtures/activitiesApi/getScheduledInstance93.json'
import getScheduledInstanceEnglishLevel2 from '../../../fixtures/activitiesApi/getScheduledInstance11.json'
import AttendanceDashboardPage from '../../../pages/recordAttendance/attendanceDashboard'
import ActivitiesIndexPage from '../../../pages/activities'
import getAttendanceSummaryCancelled from '../../../fixtures/activitiesApi/getAttendanceSummary-11-93-94-cancelled.json'
import getCategories from '../../../fixtures/activitiesApi/getCategories.json'
import getEventLocations from '../../../fixtures/prisonApi/getEventLocations.json'
import getAttendanceReasons from '../../../fixtures/activitiesApi/getAttendanceReasons.json'
import UncancelActivitiesListPage from '../../../pages/recordAttendance/uncancelActivitiesList'
import UncancelConfirmMultiplePage from '../../../pages/recordAttendance/uncancelConfirmMultiple'
import UncancelConfirmSinglePage from '../../../pages/recordAttendance/uncancelConfirmSingle'

context('Cancel Multiple Sessions', () => {
  const today = startOfToday()
  const tomorrow = startOfTomorrow()
  const todayStr = format(today, 'yyyy-MM-dd')
  const tomorrowStr = format(tomorrow, 'yyyy-MM-dd')

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.signIn()

    getScheduledInstanceEnglishLevel1.date = todayStr
    getScheduledInstanceEnglishLevel1.cancelled = true
    getScheduledInstanceEnglishLevel2.date = todayStr
    getScheduledInstanceEnglishLevel2.cancelled = true

    cy.stubEndpoint(
      'GET',
      `/scheduled-instances/attendance-summary\\?prisonCode=MDI&date=${todayStr}`,
      getAttendanceSummaryCancelled,
    )
    cy.stubEndpoint('GET', '/activity-categories', getCategories)
    cy.stubEndpoint('GET', '/attendance-reasons', getAttendanceReasons)
    cy.stubEndpoint('GET', '/api/agencies/MDI/eventLocations', getEventLocations)
    cy.stubEndpoint('PUT', '/scheduled-instances/uncancel')
    cy.stubEndpoint('GET', '/scheduled-instances/93', getScheduledInstanceEnglishLevel1)
    cy.stubEndpoint('GET', '/scheduled-instances/11', getScheduledInstanceEnglishLevel2)
  })

  it('Should uncancel multiple activities', () => {
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
    activitiesPage.uncancelSessionsLink().click()

    const uncancelActivitiesListPage = Page.verifyOnPage(UncancelActivitiesListPage)
    uncancelActivitiesListPage.containsActivities('English level 1', 'English level 2')
    uncancelActivitiesListPage.selectActivitiesWithNames('English level 1', 'English level 2')
    uncancelActivitiesListPage.uncancelSessions()

    const uncancelConfirmMultiplePage = Page.verifyOnPage(UncancelConfirmMultiplePage)
    uncancelConfirmMultiplePage.title(2)
    uncancelConfirmMultiplePage.selectYes()
    uncancelConfirmMultiplePage.confirm()

    Page.verifyOnPage(UncancelActivitiesListPage)
  })

  it('Should uncancel single activity', () => {
    getScheduledInstanceEnglishLevel1.date = tomorrowStr
    getScheduledInstanceEnglishLevel2.date = tomorrowStr

    cy.stubEndpoint(
      'GET',
      `/scheduled-instances/attendance-summary\\?prisonCode=MDI&date=${tomorrowStr}`,
      getAttendanceSummaryCancelled,
    )

    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.activitiesCard().click()

    const activitiesIndexPage = Page.verifyOnPage(ActivitiesIndexPage)
    activitiesIndexPage.recordAttendanceCard().click()

    const recordAttendancePage = Page.verifyOnPage(AttendanceDashboardPage)
    recordAttendancePage.recordAttendanceCard().click()

    const selectPeriodPage = Page.verifyOnPage(SelectPeriodPage)
    selectPeriodPage.enterDate(new Date(tomorrowStr))
    selectPeriodPage.selectAM()
    selectPeriodPage.selectPM()
    selectPeriodPage.selectED()
    selectPeriodPage.continue()

    const activitiesPage = Page.verifyOnPage(ActivitiesPage)
    activitiesPage.containsActivities('English level 1', 'English level 2', 'Gym sports and fitness')
    activitiesPage.uncancelSessionsLink().click()

    const uncancelActivitiesListPage = Page.verifyOnPage(UncancelActivitiesListPage)
    uncancelActivitiesListPage.containsActivities('English level 1', 'English level 2')
    uncancelActivitiesListPage.selectActivitiesWithNames('English level 2')
    uncancelActivitiesListPage.uncancelSessions()

    const uncancelConfirmSinglePage = Page.verifyOnPage(UncancelConfirmSinglePage)
    uncancelConfirmSinglePage.title('English level 2')
    uncancelConfirmSinglePage.selectYes()
    uncancelConfirmSinglePage.confirm()

    Page.verifyOnPage(UncancelActivitiesListPage)
  })
})
