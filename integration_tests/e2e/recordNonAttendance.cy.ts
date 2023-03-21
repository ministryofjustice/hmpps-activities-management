import { format } from 'date-fns'
import IndexPage from '../pages/index'
import Page from '../pages/page'
import SelectPeriodPage from '../pages/recordAttendance/selectPeriod'
import ActivitiesPage from '../pages/recordAttendance/activitiesPage'
import AttendanceListPage from '../pages/recordAttendance/attendanceList'
import getAttendanceReasons from '../fixtures/activitiesApi/getAttendanceReasons.json'
import getScheduledInstances from '../fixtures/activitiesApi/getScheduledInstancesMdi20230202.json'
import getScheduledInstance from '../fixtures/activitiesApi/getScheduledInstance93.json'
import getScheduledEvents from '../fixtures/activitiesApi/getScheduledEventsMdi20230202.json'
import getInmateDetails from '../fixtures/prisonApi/getInmateDetailsForNonAttendance.json'
import NotAttendedReasonPage from '../pages/recordAttendance/notAttendedReason'
import getCategories from '../fixtures/activitiesApi/getCategories.json'

context('Record non attendance', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubPrisonUser')
    cy.signIn()

    cy.stubEndpoint(
      'GET',
      '/prisons/MDI/scheduled-instances\\?startDate=2023-02-02&endDate=2023-02-02',
      getScheduledInstances,
    )
    cy.stubEndpoint('GET', '/scheduled-instances/93', getScheduledInstance)
    cy.stubEndpoint('POST', '/scheduled-events/prison/MDI\\?date=2023-02-02', getScheduledEvents)
    cy.stubEndpoint('POST', '/api/bookings/offenders', getInmateDetails)
    cy.stubEndpoint('PUT', '/attendances')
    cy.stubEndpoint('GET', '/attendance-reasons', getAttendanceReasons)
    cy.stubEndpoint('GET', '/activity-categories', getCategories)
  })

  it('should click through record non attendance journey', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage
      .recordAttendanceCard()
      .should('contain.text', 'Mark attendance at activities and appointments and get printable attendance lists.')
    indexPage.recordAttendanceCard().click()

    const selectPeriodPage = Page.verifyOnPage(SelectPeriodPage)
    selectPeriodPage.enterDate(format(new Date(2023, 1, 2), 'yyyy-MM-dd'))
    selectPeriodPage.submit()

    const activitiesPage = Page.verifyOnPage(ActivitiesPage)
    activitiesPage.activityRows().should('have.length', 4)
    activitiesPage.selectActivityWithName('English level 1')

    const attendanceListPage = Page.verifyOnPage(AttendanceListPage)
    attendanceListPage.selectPrisoner('Cudmastarie Aborah')
    attendanceListPage.selectPrisoner('Eeteljan Arianniver')
    attendanceListPage.markAsNotAttended()

    const notAttendedReasonPage = Page.verifyOnPage(NotAttendedReasonPage)
    notAttendedReasonPage.selectRadio('notAttendedData[G5897GP][notAttendedReason]')
    notAttendedReasonPage.selectRadio('notAttendedData[G5897GP][sickPay]')
    notAttendedReasonPage.selectRadio('notAttendedData[G7218GI][notAttendedReason]')
    notAttendedReasonPage.selectRadio('notAttendedData[G7218GI][sickPay]')
    notAttendedReasonPage.submit()

    Page.verifyOnPage(AttendanceListPage)
  })
})
