import { addDays, format } from 'date-fns'
import IndexPage from '../../../pages'
import Page from '../../../pages/page'
import ActivitiesIndexPage from '../../../pages/activities'
import AttendanceDashboardPage from '../../../pages/recordAttendance/attendanceDashboard'
import SelectPeriodPage from '../../../pages/activities/attendanceSummary/selectPeriod'
import ActivitiesPage from '../../../pages/recordAttendance/activitiesPage'
import AttendanceListPage from '../../../pages/recordAttendance/attendanceList'
import getActivityCategories from '../../../fixtures/activitiesApi/getActivityCategories.json'
import getAttendanceSummary from '../../../fixtures/activitiesApi/getAttendanceSummary.json'
import getNonResidentialActivityLocations from '../../../fixtures/locationsinsideprison/non-residential-usage-activities.json'
import getAllAttendances from '../../../fixtures/activitiesApi/getAllAttendances.json'
import getScheduledInstanceEnglishLevel2 from '../../../fixtures/activitiesApi/getScheduledInstance11.json'
import getAttendanceList11 from '../../../fixtures/activitiesApi/getAttendanceList.json'
import getScheduledEvents from '../../../fixtures/activitiesApi/getScheduledEventsMdi20230202.json'
import getInmateDetails from '../../../fixtures/prisonerSearchApi/getInmateDetailsForAttendance.json'

context('Exclude multiple prisoners', () => {
  const date3DaysFromNow = format(addDays(new Date(), 3), 'yyyy-MM-dd')

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.signIn()

    // Update fixture date
    getScheduledInstanceEnglishLevel2.date = date3DaysFromNow

    // Stub endpoints
    cy.stubEndpoint('GET', '/activity-categories', getActivityCategories)
    cy.stubEndpoint(
      'GET',
      `/scheduled-instances/attendance-summary\\?prisonCode=MDI&date=${date3DaysFromNow}`,
      getAttendanceSummary,
    )
    cy.stubEndpoint(
      'GET',
      '/locations/prison/MDI/non-residential-usage-type\\?formatLocalName=true',
      getNonResidentialActivityLocations,
    )
    cy.stubEndpoint(
      'GET',
      `/activities/attendance/.+/activities\\?date=${date3DaysFromNow}&sessionFilters=AM`,
      getAllAttendances,
    )
    cy.stubEndpoint('GET', '/scheduled-instances/11.*', getScheduledInstanceEnglishLevel2)

    cy.stubEndpoint('GET', '/activities/attendance/.*/activities/.*/attendance-list.*', getAttendanceList11)

    cy.stubEndpoint('POST', `/scheduled-events/prison/MDI\\?date=${date3DaysFromNow}`, getScheduledEvents)
    cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', getInmateDetails)
  })

  it('should select English level 2 and mark multiple prisoners as not required', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.activitiesCard().click()

    const activitiesIndexPage = Page.verifyOnPage(ActivitiesIndexPage)
    activitiesIndexPage.recordAttendanceCard().click()

    const recordAttendancePage = Page.verifyOnPage(AttendanceDashboardPage)
    recordAttendancePage.recordAttendanceCard().click()

    const selectPeriodPage = Page.verifyOnPage(SelectPeriodPage)
    selectPeriodPage.selectADifferentDate()
    selectPeriodPage.pickDateFromToday(3)
    selectPeriodPage.selectAM()
    selectPeriodPage.continue()

    const activitiesPage = Page.verifyOnPage(ActivitiesPage)
    activitiesPage.containsActivities('English level 1', 'English level 2', 'Football', 'Maths level 1')
    activitiesPage.selectActivityWithName('English level 2')

    const attendanceListPage = Page.verifyOnPage(AttendanceListPage)
    attendanceListPage.checkAttendanceStatuses('Andy, Booking', 'Attended')
    attendanceListPage.checkAttendanceStatuses('Aborah, Cudmastarie', 'Attended')
    attendanceListPage.checkAttendanceStatuses('Aisho, Egurztof', 'Not recorded')
    attendanceListPage.checkAttendanceStatuses('Alejoy, Thaddorah', 'Not recorded')
  })
})
