import { format, startOfToday } from 'date-fns'
import IndexPage from '../../../pages'
import Page from '../../../pages/page'
import SelectPeriodPage from '../../../pages/recordAttendance/selectPeriod'
import ActivitiesPage from '../../../pages/recordAttendance/activitiesPage'
import getScheduledInstanceEnglishLevel1 from '../../../fixtures/activitiesApi/getScheduledInstance93.json'
import getScheduledInstanceEnglishLevel1Cancelled from '../../../fixtures/activitiesApi/getScheduledInstance-cancelled.json'
import AttendanceDashboardPage from '../../../pages/recordAttendance/attendanceDashboard'
import ActivitiesIndexPage from '../../../pages/activities'
import getAttendanceSummary from '../../../fixtures/activitiesApi/getAttendanceSummary-11-93-94.json'
import getCategories from '../../../fixtures/activitiesApi/getCategories.json'
import getAttendeesForScheduledInstance from '../../../fixtures/activitiesApi/getAttendeesScheduledInstance93.json'
import getInmateDetails from '../../../fixtures/prisonerSearchApi/getInmateDetailsForAttendance.json'
import getScheduledEvents from '../../../fixtures/activitiesApi/getScheduledEventsMdi20230202.json'
import AttendanceListPage from '../../../pages/recordAttendance/attendanceList'
import CancelSessionPage from '../../../pages/recordAttendance/cancelSessionReason'
import CancelSessionConfirmPage from '../../../pages/recordAttendance/cancelSessionConfirm'
import getNonResidentialActivityLocations from '../../../fixtures/locationsinsideprison/non-residential-usage-activities.json'

context('Cancel an activity session (single)', () => {
  const today = startOfToday()
  const todayStr = format(today, 'yyyy-MM-dd')
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.signIn()

    getScheduledInstanceEnglishLevel1.date = todayStr
    getScheduledInstanceEnglishLevel1Cancelled.date = todayStr

    cy.stubEndpoint(
      'GET',
      `/scheduled-instances/attendance-summary\\?prisonCode=MDI&date=${todayStr}`,
      getAttendanceSummary,
    )
    cy.stubEndpoint('GET', '/activity-categories', getCategories)
    cy.stubEndpoint(
      'GET',
      '/locations/prison/MDI/non-residential-usage-type\\?formatLocalName=true',
      getNonResidentialActivityLocations,
    )
    cy.stubEndpoint('GET', '/scheduled-instances/93', getScheduledInstanceEnglishLevel1 as unknown as JSON)
    cy.stubEndpoint('GET', '/scheduled-instances/93/scheduled-attendees', getAttendeesForScheduledInstance)
    cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', getInmateDetails as unknown as JSON)
    cy.stubEndpoint('POST', `/scheduled-events/prison/MDI\\?date=${todayStr}`, getScheduledEvents as unknown as JSON)
    cy.stubEndpoint('PUT', '/scheduled-instances/93/cancel')
  })

  it('should cancel a session', () => {
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
    activitiesPage.getLinkByText('English level 1').invoke('attr', 'target', '_self').click()

    const attendanceListPage = Page.verifyOnPage(AttendanceListPage)
    attendanceListPage.getLinkByText('Cancel this session').click()

    const cancelSessionPage = Page.verifyOnPage(CancelSessionPage)
    cancelSessionPage.title()
    cancelSessionPage.caption().contains('Prisoners will be paid and recorded as having an acceptable absence.')
    cancelSessionPage.selectReason('Staff unavailable')
    cancelSessionPage.continue()

    const cancelSessionConfirmPage = Page.verifyOnPage(CancelSessionConfirmPage)
    cancelSessionConfirmPage.title()
    cancelSessionConfirmPage
      .caption()
      .contains('Cancelling the session will record an acceptable absence for all prisoners.')
    cancelSessionConfirmPage.selectConfirmation('No')
    cancelSessionConfirmPage.confirm()

    attendanceListPage.getLinkByText('Cancel this session').click()

    cancelSessionPage.title()
    cancelSessionPage.caption()
    cancelSessionPage.selectReason('Staff training')
    cancelSessionPage.moreDetailsInput().type('All the staff are busy with mandatory learning modules.')
    cancelSessionPage.continue()

    cancelSessionConfirmPage.title()
    cancelSessionConfirmPage.caption()
    cancelSessionConfirmPage.selectConfirmation('Yes')
    cancelSessionConfirmPage.confirm()

    Page.verifyOnPage(AttendanceListPage)
  })
  it('should show the correct details in the cancelled banner at the top of the page', () => {
    getScheduledInstanceEnglishLevel1Cancelled.cancelledIssuePayment = null
    cy.stubEndpoint('GET', '/scheduled-instances/93', getScheduledInstanceEnglishLevel1Cancelled as unknown as JSON)
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
    activitiesPage.getLinkByText('English level 1').invoke('attr', 'target', '_self').click()

    const attendanceListPage = Page.verifyOnPage(AttendanceListPage)
    attendanceListPage.assertNotificationContents(
      'Session cancelled',
      'This activity session has been cancelled by USER1 - J. Smith on Thursday, 2 February 2023 for the following reason:',
      'Location unavailable - this is a comment',
    )
    attendanceListPage.getLinkByText('View or edit cancellation').should('not.exist')
  })
})
