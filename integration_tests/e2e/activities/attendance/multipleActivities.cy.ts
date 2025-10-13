import { format, startOfToday } from 'date-fns'
import IndexPage from '../../../pages'
import Page from '../../../pages/page'
import SelectPeriodPage from '../../../pages/recordAttendance/selectPeriod'
import ActivitiesPage from '../../../pages/recordAttendance/activitiesPage'
import MultipleAttendanceListPage from '../../../pages/recordAttendance/attendanceListMultiple'
import SingleAttendanceListPage from '../../../pages/recordAttendance/attendanceList'
import getAttendanceSummary from '../../../fixtures/activitiesApi/getAttendanceSummary.json'
import getScheduledInstanceEnglishLevel1 from '../../../fixtures/activitiesApi/getScheduledInstance93.json'
import getScheduledInstanceEnglishLevel2 from '../../../fixtures/activitiesApi/getScheduledInstance11.json'
import getAttendeesForScheduledInstance from '../../../fixtures/activitiesApi/getAttendeesScheduledInstance93.json'
import getScheduledEvents from '../../../fixtures/activitiesApi/getScheduledEventsMdi20230202.json'
import getInmateDetails from '../../../fixtures/prisonerSearchApi/getInmateDetailsForAttendance.json'
import getCategories from '../../../fixtures/activitiesApi/getCategories.json'
import AttendanceDashboardPage from '../../../pages/recordAttendance/attendanceDashboard'
import ActivitiesIndexPage from '../../../pages/activities'
import getAttendanceReasons from '../../../fixtures/activitiesApi/getAttendanceReasons.json'
import NotAttendedReasonPage from '../../../pages/recordAttendance/notAttendedReason'
import { formatDate } from '../../../../server/utils/utils'
import getNonResidentialActivityLocations from '../../../fixtures/locationsinsideprison/non-residential-usage-activities.json'

context('Record attendance', () => {
  const today = startOfToday()
  const todayStr = format(today, 'yyyy-MM-dd')
  let getScheduledInstances

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.signIn()

    cy.stubEndpoint(
      'GET',
      `/scheduled-instances/attendance-summary\\?prisonCode=MDI&date=${todayStr}`,
      getAttendanceSummary,
    )

    getScheduledInstanceEnglishLevel1.date = todayStr
    getScheduledInstanceEnglishLevel2.date = todayStr

    getScheduledInstanceEnglishLevel1.attendances[2].status = 'WAITING'
    getScheduledInstanceEnglishLevel1.attendances[2].attendanceReason = null

    getScheduledInstanceEnglishLevel2.attendances[2].status = 'WAITING'
    getScheduledInstanceEnglishLevel2.attendances[2].attendanceReason = null

    cy.stubEndpoint('GET', '/scheduled-instances/93', getScheduledInstanceEnglishLevel1)
    cy.stubEndpoint('GET', '/scheduled-instances/11', getScheduledInstanceEnglishLevel2)

    getScheduledInstances = [getScheduledInstanceEnglishLevel1, getScheduledInstanceEnglishLevel2]

    cy.stubEndpoint('POST', '/scheduled-instances', getScheduledInstances)

    cy.stubEndpoint('GET', '/scheduled-instances/93/scheduled-attendees', getAttendeesForScheduledInstance)
    cy.stubEndpoint('POST', `/scheduled-events/prison/MDI\\?date=${todayStr}`, getScheduledEvents)
    cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', getInmateDetails)
    cy.stubEndpoint('PUT', '/attendances')
    cy.stubEndpoint('GET', '/activity-categories', getCategories)
    cy.stubEndpoint('GET', '/attendance-reasons', getAttendanceReasons)
    cy.stubEndpoint(
      'GET',
      '/locations/prison/MDI/non-residential-usage-type\\?formatLocalName=true',
      getNonResidentialActivityLocations,
    )
  })

  it('Mark attendances for multiple activities', () => {
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
    selectPeriodPage.continue()

    const activitiesPage = Page.verifyOnPage(ActivitiesPage)
    activitiesPage.containsActivities('English level 1', 'English level 2', 'Football', 'Gym', 'Maths level 1')
    activitiesPage.selectActivitiesWithNames('English level 1', 'English level 2')
    activitiesPage.getButton('Record or edit attendance').click()

    const attendanceListPage = Page.verifyOnPage(MultipleAttendanceListPage)
    attendanceListPage.assertRow(
      0,
      false,
      'Andy, Booking',
      '3-3-017',
      'English level 1',
      '14:00 to 15:00',
      ['Did not attend', 'Paid'],
      'Attended Pay',
      'View or Edit',
    )
    attendanceListPage.assertRow(
      2,
      true,
      'Aborah, Cudmastarie',
      '4-3-016',
      'English level 1',
      '14:00 to 15:00',
      ['Attended', 'Paid'],
      'Not recorded',
    )
    attendanceListPage.assertRow(
      4,
      false,
      'Andy, Booking',
      '3-3-017',
      'English level 2',
      '14:15 to 15:15',
      ['Attended', 'Unpaid', 'Did not attend', 'Paid'],
      'Attended No pay',
      'View or Edit',
    )
    attendanceListPage.assertRow(
      6,
      true,
      'Aborah, Cudmastarie',
      '4-3-016',
      'English level 2',
      '14:15 to 15:15',
      [],
      'Not recorded',
    )

    attendanceListPage.clickRows(3, 7)

    getScheduledInstances[0].attendances[2].status = 'COMPLETED'
    getScheduledInstances[0].attendances[2].attendanceReason = { code: 'ATTENDED', description: 'Attended' }

    getScheduledInstances[1].attendances[2].status = 'COMPLETED'
    getScheduledInstances[1].attendances[2].attendanceReason = { code: 'ATTENDED', description: 'Attended' }

    cy.stubEndpoint('POST', '/scheduled-instances', getScheduledInstances)

    cy.log('Mark attendance...')

    attendanceListPage.markAsAttended()

    Page.verifyOnPage(MultipleAttendanceListPage)

    attendanceListPage.assertRow(
      2,
      false,
      'Aborah, Cudmastarie',
      '4-3-016',
      'English level 1',
      '14:00 to 15:00',
      [],
      'Attended Pay',
      'View or Edit',
    )
    attendanceListPage.assertRow(
      6,
      false,
      'Aborah, Cudmastarie',
      '4-3-016',
      'English level 2',
      '14:15 to 15:15',
      [],
      'Attended No pay',
      'View or Edit',
    )

    attendanceListPage
      .getLinkByText(`Go back to activities on ${formatDate(today, 'EEEE, d MMMM yyyy')} - AM and PM`)
      .click()
    Page.verifyOnPage(ActivitiesPage)
  })

  it('Mark non-attendances for multiple activities', () => {
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
    selectPeriodPage.continue()

    const activitiesPage = Page.verifyOnPage(ActivitiesPage)
    activitiesPage.selectActivitiesWithNames('English level 1', 'English level 2')
    activitiesPage.getButton('Record or edit attendance').click()

    const attendanceListPage = Page.verifyOnPage(MultipleAttendanceListPage)
    attendanceListPage.assertRow(
      3,
      true,
      'Arianniver, Eeteljan',
      '1-3-024',
      'English level 1',
      '14:00 to 15:00',
      [],
      'Not recorded',
    )
    attendanceListPage.assertRow(
      7,
      true,
      'Arianniver, Eeteljan',
      '1-3-024',
      'English level 2',
      '14:15 to 15:15',
      [],
      'Not recorded',
    )
    attendanceListPage.clickRows(4, 8)

    cy.log('Marking non-attendance...')

    attendanceListPage.markAsNotAttended()

    const notAttendedReasonPage = Page.verifyOnPage(NotAttendedReasonPage)
    notAttendedReasonPage.selectRadio('notAttendedData[0][notAttendedReason]')
    notAttendedReasonPage.selectRadio('notAttendedData[0][sickPay]')
    notAttendedReasonPage.selectRadio('notAttendedData[1][notAttendedReason]')
    notAttendedReasonPage.selectRadio('notAttendedData[1][sickPay]')

    getScheduledInstances[0].attendances[3].status = 'COMPLETED'
    getScheduledInstances[0].attendances[3].attendanceReason = { code: 'SICK', description: 'Sick' }

    getScheduledInstances[1].attendances[3].status = 'COMPLETED'
    getScheduledInstances[1].attendances[3].attendanceReason = { code: 'SICK', description: 'Sick' }

    cy.stubEndpoint('POST', '/scheduled-instances', getScheduledInstances)

    notAttendedReasonPage.submit()

    Page.verifyOnPage(MultipleAttendanceListPage)

    attendanceListPage.assertRow(
      3,
      false,
      'Arianniver, Eeteljan',
      '1-3-024',
      'English level 1',
      '14:00 to 15:00',
      [],
      'Sick Pay',
      'View or Edit',
    )
    attendanceListPage.assertRow(
      7,
      false,
      'Arianniver, Eeteljan',
      '1-3-024',
      'English level 2',
      '14:15 to 15:15',
      [],
      'Sick No pay',
      'View or Edit',
    )
  })

  it('Mark attendances for single activity', () => {
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
    activitiesPage.containsActivities('English level 1', 'English level 2', 'Football', 'Maths level 1')
    activitiesPage.selectActivitiesWithNames('English level 1')
    activitiesPage.getButton('Record or edit attendance').click()

    const attendanceListPage = Page.verifyOnPage(SingleAttendanceListPage)
    attendanceListPage.checkAttendanceStatuses('Andy, Booking', 'Attended', 'Pay')
    attendanceListPage
      .backLink()
      .contains(`Go back to activities for ${formatDate(today, 'EEEE, d MMMM yyyy')} - AM`)
      .click()

    Page.verifyOnPage(ActivitiesPage)
  })
})
