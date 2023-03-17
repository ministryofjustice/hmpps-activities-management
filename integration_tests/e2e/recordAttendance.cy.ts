import { format, startOfToday } from 'date-fns'
import IndexPage from '../pages/index'
import Page from '../pages/page'
import SelectPeriodPage from '../pages/recordAttendance/selectPeriod'
import ActivitiesPage from '../pages/recordAttendance/activitiesPage'
import AttendanceListPage from '../pages/recordAttendance/attendanceList'
import CancelSessionReason from '../pages/recordAttendance/cancelSessionReason'
import CancelSessionConfirm from '../pages/recordAttendance/cancelSessionConfirm'
import getScheduledInstances from '../fixtures/activitiesApi/getScheduledInstancesMdi20230202.json'
import getScheduledInstance from '../fixtures/activitiesApi/getScheduledInstance93.json'
import getCancelledScheduledInstance from '../fixtures/activitiesApi/getScheduledInstance-cancelled.json'
import getScheduledEvents from '../fixtures/activitiesApi/getScheduledEventsMdi20230202.json'
import getInmateDetails from '../fixtures/prisonApi/getInmateDetailsForAttendance.json'

context('Record attendance', () => {
  const today = format(startOfToday(), 'yyyy-MM-dd')

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubPrisonUser')
    cy.signIn()

    getScheduledInstance.date = today
    getCancelledScheduledInstance.date = today

    cy.stubEndpoint(
      'GET',
      `/prisons/MDI/scheduled-instances\\?startDate=${today}&endDate=${today}`,
      getScheduledInstances,
    )
    cy.stubEndpoint('GET', '/scheduled-instances/93', getScheduledInstance)
    cy.stubEndpoint('POST', `/scheduled-events/prison/MDI\\?date=${today}`, getScheduledEvents)
    cy.stubEndpoint('POST', '/api/bookings/offenders', getInmateDetails)
    cy.stubEndpoint('PUT', '/attendances')
    cy.stubEndpoint('PUT', '/scheduled-instances/93/cancel')
    cy.stubEndpoint('PUT', '/scheduled-instances/93/uncancel')
  })

  it('should click through record attendance journey', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage
      .recordAttendanceCard()
      .should('contain.text', 'Mark attendance at activities and appointments and get printable attendance lists.')
    indexPage.recordAttendanceCard().click()

    const selectPeriodPage = Page.verifyOnPage(SelectPeriodPage)
    selectPeriodPage.enterDate(today)
    selectPeriodPage.submit()

    const activitiesPage = Page.verifyOnPage(ActivitiesPage)
    activitiesPage.activityRows().should('have.length', 4)
    activitiesPage.selectActivityWithName('English level 1')

    const attendanceListPage = Page.verifyOnPage(AttendanceListPage)
    attendanceListPage.checkAttendanceStatus('Booking Andy', 'Attended')
    attendanceListPage.checkAttendanceStatus('Booking Andy', 'Pay')
    attendanceListPage.selectPrisoner('Cudmastarie Aborah')
    attendanceListPage.selectPrisoner('Eeteljan Arianniver')
    attendanceListPage.markAsAttended()
    Page.verifyOnPage(AttendanceListPage)

    attendanceListPage.cancelSessionButton().click()
    cy.stubEndpoint('GET', '/scheduled-instances/93', getCancelledScheduledInstance)

    const cancelSessionReasonPage = Page.verifyOnPage(CancelSessionReason)
    cancelSessionReasonPage.selectReason('Location unavailable')
    cancelSessionReasonPage.moreDetailsInput().type('Location in use')
    cancelSessionReasonPage.continue()

    const cancelSessionConfirmPage = Page.verifyOnPage(CancelSessionConfirm)
    cancelSessionConfirmPage.selectConfirmation('Yes')
    cancelSessionConfirmPage.continue()

    Page.verifyOnPage(AttendanceListPage)
  })
})
