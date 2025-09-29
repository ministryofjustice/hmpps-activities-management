import { format, startOfTomorrow } from 'date-fns'
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
import NotRequiredOrExcusedPaidOrNotPage from '../../../pages/recordAttendance/notRequiredOrExcusedPaidOrNot'
import NotRequiredOrExcusedCheckAndConfirmPage from '../../../pages/recordAttendance/notRequiredOrExcusedCheckAndConfirm'
import getAdvanceListExcused from '../../../fixtures/activitiesApi/getAdvanceListExcused.json'

context('Exclude multiple prisoners from an activity', () => {
  const tomorrow = startOfTomorrow()
  const tomorrowStr = format(tomorrow, 'yyyy-MM-dd')

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.signIn()

    getScheduledInstanceEnglishLevel2.date = tomorrowStr

    cy.stubEndpoint('GET', '/activity-categories', getActivityCategories)

    cy.stubEndpoint(
      'GET',
      `/scheduled-instances/attendance-summary\\?prisonCode=MDI&date=${tomorrowStr}`,
      getAttendanceSummary,
    )
    cy.stubEndpoint(
      'GET',
      '/locations/prison/MDI/non-residential-usage-type\\?formatLocalName=true',
      getNonResidentialActivityLocations,
    )
    cy.stubEndpoint(
      'GET',
      `/activities/attendance/.*/activities\\?date=${tomorrowStr}&sessionFilters=AM`,
      getAllAttendances,
    )

    cy.stubEndpoint('GET', '/scheduled-instances/11/scheduled-attendees', getAttendanceList11)

    // Specific scheduled instance details
    cy.stubEndpoint('GET', '/scheduled-instances/11', getScheduledInstanceEnglishLevel2)

    // Scheduled events
    cy.stubEndpoint('POST', `/scheduled-events/prison/MDI\\?date=${tomorrowStr}(&timeSlot=.*)?`, getScheduledEvents)

    // Prisoner search
    cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', getInmateDetails)
    cy.stubEndpoint('POST', '/advance-attendances', getAdvanceListExcused)
  })

  it('should select English level 2 and mark multiple prisoners as not required (paid)', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.activitiesCard().click()

    const activitiesIndexPage = Page.verifyOnPage(ActivitiesIndexPage)
    activitiesIndexPage.recordAttendanceCard().click()

    const recordAttendancePage = Page.verifyOnPage(AttendanceDashboardPage)
    recordAttendancePage.recordAttendanceCard().click()

    const selectPeriodPage = Page.verifyOnPage(SelectPeriodPage)
    selectPeriodPage.selectADifferentDate()
    selectPeriodPage.pickDateFromToday(1)
    selectPeriodPage.selectAM()
    selectPeriodPage.continue()

    const activitiesPage = Page.verifyOnPage(ActivitiesPage)
    activitiesPage.containsActivities('English level 1', 'English level 2', 'Football', 'Maths level 1')
    activitiesPage.selectActivityWithName('English level 2')

    const attendanceListPage = Page.verifyOnPage(AttendanceListPage)
    attendanceListPage.checkAttendanceStatuses('Andy, Booking', 'Attended')
    attendanceListPage.checkAttendanceStatuses('Aborah, Cudmastarie', 'Not recorded')
    attendanceListPage.checkAttendanceStatuses('Aisho, Egurztof', 'Attended')
    attendanceListPage.checkAttendanceStatuses('Arianniver, Eeteljan', 'Not recorded')
    attendanceListPage.markSelectedPrisonersNotRequired([
      'Andy, Booking',
      'Aborah, Cudmastarie',
      'Aisho, Egurztof',
      'Arianniver, Eeteljan',
    ])

    const notRequiredOrExcusedPaidOrNotPage = Page.verifyOnPage(NotRequiredOrExcusedPaidOrNotPage)
    notRequiredOrExcusedPaidOrNotPage.getRadioByValue('paidOrNot', 'yes').check({ force: true })
    notRequiredOrExcusedPaidOrNotPage.continue()
    const notRequiredOrExcusedCheckAndConfirmPage = Page.verifyOnPage(NotRequiredOrExcusedCheckAndConfirmPage)
    notRequiredOrExcusedCheckAndConfirmPage.confirm()
    Page.verifyOnPage(AttendanceListPage)
    attendanceListPage.assertNotificationContents(
      'Attendee list updated',
      `You've marked 4 people as not required for this session.`,
    )
  })

  it('should select English level 2 and mark multiple prisoners as not required (unpaid)', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.activitiesCard().click()

    const activitiesIndexPage = Page.verifyOnPage(ActivitiesIndexPage)
    activitiesIndexPage.recordAttendanceCard().click()

    const recordAttendancePage = Page.verifyOnPage(AttendanceDashboardPage)
    recordAttendancePage.recordAttendanceCard().click()

    const selectPeriodPage = Page.verifyOnPage(SelectPeriodPage)
    selectPeriodPage.selectADifferentDate()
    selectPeriodPage.pickDateFromToday(1)
    selectPeriodPage.selectAM()
    selectPeriodPage.continue()

    const activitiesPage = Page.verifyOnPage(ActivitiesPage)
    activitiesPage.containsActivities('English level 1', 'English level 2', 'Football', 'Maths level 1')
    activitiesPage.selectActivityWithName('English level 2')

    const attendanceListPage = Page.verifyOnPage(AttendanceListPage)
    attendanceListPage.checkAttendanceStatuses('Andy, Booking', 'Attended')
    attendanceListPage.checkAttendanceStatuses('Aborah, Cudmastarie', 'Not recorded')
    attendanceListPage.checkAttendanceStatuses('Aisho, Egurztof', 'Attended')
    attendanceListPage.checkAttendanceStatuses('Arianniver, Eeteljan', 'Not recorded')
    attendanceListPage.markSelectedPrisonersNotRequired([
      'Andy, Booking',
      'Aborah, Cudmastarie',
      'Aisho, Egurztof',
      'Arianniver, Eeteljan',
    ])
    const notRequiredOrExcusedPaidOrNotPage = Page.verifyOnPage(NotRequiredOrExcusedPaidOrNotPage)
    notRequiredOrExcusedPaidOrNotPage.getRadioByValue('paidOrNot', 'no').check({ force: true })
    notRequiredOrExcusedPaidOrNotPage.continue()
    const notRequiredOrExcusedCheckAndConfirmPage = Page.verifyOnPage(NotRequiredOrExcusedCheckAndConfirmPage)
    notRequiredOrExcusedCheckAndConfirmPage.confirm()
    Page.verifyOnPage(AttendanceListPage)
    attendanceListPage.assertNotificationContents(
      'Attendee list updated',
      `You've marked 4 people as not required for this session.`,
    )
  })
})
