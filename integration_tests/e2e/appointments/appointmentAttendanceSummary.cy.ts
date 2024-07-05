import { addDays, subDays } from 'date-fns'
import EventTier from '../../../server/enum/eventTiers'

import Page from '../../pages/page'
import IndexPage from '../../pages'
import AppointmentsManagementPage from '../../pages/appointments/appointmentsManagementPage'
import SelectDatePage from '../../pages/appointments/appointments-attendance-summary/selectDate'
import DashboardPage from '../../pages/appointments/appointments-attendance-summary/dashboard'
import AttendanceData from '../../pages/appointments/appointments-attendance-summary/attendanceData'
import { formatDate } from '../../../server/utils/utils'
import getCategories from '../../fixtures/activitiesApi/getAppointmentCategories.json'
import getAppointmentAttendanceSummaries1 from '../../fixtures/activitiesApi/getAppointmentAttendanceSummaries1.json'
import getAppointmentAttendanceSummaries2 from '../../fixtures/activitiesApi/getAppointmentAttendanceSummaries2.json'
import getAttendanceByStatus from '../../fixtures/activitiesApi/getAttendanceByStatus.json'
import getInmateDetails from '../../fixtures/prisonerSearchApi/getInmateDetailsForAttendance.json'
import { AttendanceStatus } from '../../../server/@types/appointments'

context('Appointment attendancy summary statistics', () => {
  const now = new Date()
  const todayFormatted = formatDate(now, 'yyyy-MM-dd')
  const yesterday = subDays(new Date(), 1)
  const yesterdayFormatted = formatDate(yesterday, 'yyyy-MM-dd')
  const yesterdayFormattedLong = formatDate(yesterday)
  const tomorrow = addDays(new Date(), 1)
  const tomorrowFormatted = formatDate(tomorrow, 'yyyy-MM-dd')
  const tomorrowFormattedLong = formatDate(tomorrow)

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.signIn()
    cy.stubEndpoint('GET', '/appointment-categories', getCategories)
    cy.stubEndpoint(
      'GET',
      `/appointments/MDI/attendance-summaries\\?date=${todayFormatted}`,
      getAppointmentAttendanceSummaries1,
    )
    cy.stubEndpoint(
      'GET',
      `/appointments/MDI/attendance-summaries\\?date=${yesterdayFormatted}`,
      getAppointmentAttendanceSummaries2,
    )
    cy.stubEndpoint(
      'GET',
      `/appointments/MDI/attendance-summaries\\?date=${tomorrowFormatted}`,
      getAppointmentAttendanceSummaries1,
    )
    cy.stubEndpoint(
      'GET',
      `/appointments/MDI/${AttendanceStatus.ATTENDED}/attendance\\?date=${tomorrowFormatted}`,
      getAttendanceByStatus,
    )
    cy.stubEndpoint(
      'GET',
      `/appointments/MDI/${AttendanceStatus.NOT_ATTENDED}/attendance\\?date=${tomorrowFormatted}`,
      getAttendanceByStatus.slice(0, 9),
    )
    cy.stubEndpoint(
      'GET',
      `/appointments/MDI/${AttendanceStatus.NOT_ATTENDED}/attendance\\?date=${tomorrowFormatted}&prisonerNumber=G5897GP`,
      getAttendanceByStatus.slice(0, 7),
    )
    cy.stubEndpoint(
      'GET',
      `/appointments/MDI/${AttendanceStatus.NOT_RECORDED}/attendance\\?date=${tomorrowFormatted}`,
      getAttendanceByStatus.slice(0, 12),
    )
    cy.stubEndpoint(
      'GET',
      `/appointments/MDI/${AttendanceStatus.EVENT_TIER}/attendance\\?date=${tomorrowFormatted}&eventTier=${EventTier.TIER_1}`,
      getAttendanceByStatus.slice(0, 3),
    )
    cy.stubEndpoint(
      'GET',
      `/appointments/MDI/${AttendanceStatus.NOT_RECORDED}/attendance\\?date=${tomorrowFormatted}&customName=candle`,
      getAttendanceByStatus.slice(0, 12),
    )
    cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', getInmateDetails)
  })

  it('should follow validation rules', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.appointmentsManagementCard().click()

    const appointmentsManagementPage = Page.verifyOnPage(AppointmentsManagementPage)
    appointmentsManagementPage.viewAppointmentsAttendanceSummaryCard().click()

    const selectDatePage = Page.verifyOnPage(SelectDatePage)
    selectDatePage.confirmButton().click()
    selectDatePage.errorSummary().contains('Select a date to record attendance for')
    selectDatePage.dateChoice().find('input[value="other"]').check()
    selectDatePage.confirmButton().click()
    selectDatePage.errorSummary().contains('Enter a valid date')
  })
  it('should render the select date page - today', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.appointmentsManagementCard().click()

    const appointmentsManagementPage = Page.verifyOnPage(AppointmentsManagementPage)
    appointmentsManagementPage.viewAppointmentsAttendanceSummaryCard().click()

    const selectDatePage = Page.verifyOnPage(SelectDatePage)
    selectDatePage.dateChoice().find('input[value="today"]').check()

    selectDatePage.confirmButton().click()
    const dashboardPage = Page.verifyOnPage(DashboardPage)
    cy.location().should(loc => {
      expect(loc.pathname).to.eq('/appointments/attendance-summary/dashboard')
    })
    dashboardPage.dateCaption().contains(formatDate(now))
    dashboardPage.appointmentsNotCancelledTotal().contains('38 attendees for 8 appointments')

    dashboardPage.attendedStat().contains('17')
    dashboardPage.notAttendedStat().contains('9')
    dashboardPage.notRecordedStat().contains('12')
    dashboardPage.tier1Stat().contains('3')
    dashboardPage.tier2Stat().contains('8')
    dashboardPage.routineStat().contains('6')
    dashboardPage.cancelledStat().contains('0')
  })
  it('should render the select date page - yesterday', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.appointmentsManagementCard().click()

    const appointmentsManagementPage = Page.verifyOnPage(AppointmentsManagementPage)
    appointmentsManagementPage.viewAppointmentsAttendanceSummaryCard().click()

    const selectDatePage = Page.verifyOnPage(SelectDatePage)
    selectDatePage.dateChoice().find('input[value="yesterday"]').check()

    selectDatePage.confirmButton().click()
    const dashboardPage = Page.verifyOnPage(DashboardPage)
    cy.location().should(loc => {
      expect(loc.pathname).to.eq('/appointments/attendance-summary/dashboard')
    })
    dashboardPage.dateCaption().contains(yesterdayFormattedLong)
    dashboardPage.appointmentsNotCancelledTotal().contains('27 attendees for 6 appointments')
    dashboardPage.attendedStat().contains('0')
    dashboardPage.notAttendedStat().contains('0')
    dashboardPage.notRecordedStat().contains('27')
    dashboardPage.tier1Stat().contains('0')
    dashboardPage.tier2Stat().contains('0')
    dashboardPage.routineStat().contains('0')
    dashboardPage.cancelledStat().contains('1')
  })
  it('should render the select date page - chosen date', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.appointmentsManagementCard().click()

    const appointmentsManagementPage = Page.verifyOnPage(AppointmentsManagementPage)
    appointmentsManagementPage.viewAppointmentsAttendanceSummaryCard().click()

    const selectDatePage = Page.verifyOnPage(SelectDatePage)
    selectDatePage.dateChoice().find('input[value="other"]').check()
    selectDatePage.selectDatePickerDate(tomorrow)

    selectDatePage.confirmButton().click()
    const dashboardPage = Page.verifyOnPage(DashboardPage)
    cy.location().should(loc => {
      expect(loc.pathname).to.eq('/appointments/attendance-summary/dashboard')
    })

    dashboardPage.dateCaption().contains(tomorrowFormattedLong)
  })
  it('Attendance data page', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.appointmentsManagementCard().click()

    const appointmentsManagementPage = Page.verifyOnPage(AppointmentsManagementPage)
    appointmentsManagementPage.viewAppointmentsAttendanceSummaryCard().click()

    const selectDatePage = Page.verifyOnPage(SelectDatePage)
    selectDatePage.dateChoice().find('input[value="other"]').check()
    selectDatePage.selectDatePickerDate(tomorrow)

    selectDatePage.confirmButton().click()
    const dashboardPage = Page.verifyOnPage(DashboardPage)
    cy.location().should(loc => {
      expect(loc.pathname).to.eq('/appointments/attendance-summary/dashboard')
    })
    dashboardPage.attendedStatLink().click()
    const allAttendedPage = Page.verifyOnPage(AttendanceData)
    allAttendedPage.title().contains('All attended')
    allAttendedPage.subTitle().contains('17 attended')
    allAttendedPage.getInputByLabel('Search by name or prison number').should('exist')
    allAttendedPage.table().should('exist')
    allAttendedPage
      .table()
      .find('th')
      .then(heading => {
        expect(heading.get(0).innerText).to.contain('Attendee')
        expect(heading.get(1).innerText).to.contain('Cell location')
        expect(heading.get(2).innerText).to.contain('Appointment')
        expect(heading.get(3).innerText).to.contain('Time and date')
      })
    allAttendedPage
      .table()
      .find('td')
      .then(data => {
        expect(data.get(0).innerText).to.contain('Aborah, Cudmastarie Hallone\nG5897GP')
        expect(data.get(1).innerText).to.contain('4-3-016')
        expect(data.get(2).innerText).to.contain('Monday Worship (Chaplaincy)')
        expect(data.get(3).innerText).to.contain('10:30 to 11:00\n1 July 2024')
      })
  })
  it('Not attended data page - search filter - prisoner number', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.appointmentsManagementCard().click()

    const appointmentsManagementPage = Page.verifyOnPage(AppointmentsManagementPage)
    appointmentsManagementPage.viewAppointmentsAttendanceSummaryCard().click()

    const selectDatePage = Page.verifyOnPage(SelectDatePage)
    selectDatePage.dateChoice().find('input[value="other"]').check()
    selectDatePage.selectDatePickerDate(tomorrow)

    selectDatePage.confirmButton().click()
    const dashboardPage = Page.verifyOnPage(DashboardPage)
    dashboardPage.notAttendedStatLink().click()
    const attendancePage = Page.verifyOnPage(AttendanceData)
    attendancePage.getInputByLabel('Search by name or prison number').type('G5897GP')
    attendancePage.searchbarSubmit().click()
    attendancePage.subTitle().contains('7 not attended')
    cy.location().should(loc => {
      expect(loc.search).contains('searchTerm=G5897GP')
    })
  })
  it('Not attended data page - search filter - name', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.appointmentsManagementCard().click()

    const appointmentsManagementPage = Page.verifyOnPage(AppointmentsManagementPage)
    appointmentsManagementPage.viewAppointmentsAttendanceSummaryCard().click()

    const selectDatePage = Page.verifyOnPage(SelectDatePage)
    selectDatePage.dateChoice().find('input[value="other"]').check()
    selectDatePage.selectDatePickerDate(tomorrow)

    selectDatePage.confirmButton().click()
    const dashboardPage = Page.verifyOnPage(DashboardPage)
    dashboardPage.notAttendedStatLink().click()
    const attendancePage = Page.verifyOnPage(AttendanceData)
    attendancePage.title().contains('All not attended')
    attendancePage.subTitle().contains('9 not attended')
    attendancePage.getInputByLabel('Search by name or prison number').type('Aborah')
    attendancePage.searchbarSubmit().click()
    attendancePage.subTitle().contains('4 not attended')
    attendancePage
      .table()
      .find('td')
      .then(data => {
        expect(data.get(0).innerText).to.contain('Aborah, Cudmastarie Hallone\nG5897GP')
        expect(data.get(4).innerText).to.contain('Aborah, Cudmastarie Hallone\nG5897GP')
        expect(data.get(8).innerText).to.contain('Aborah, Cudmastarie Hallone\nG5897GP')
        expect(data.get(12).innerText).to.contain('Aborah, Cudmastarie Hallone\nG5897GP')
      })
  })
  it('Not recorded data page - custom name filter', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.appointmentsManagementCard().click()

    const appointmentsManagementPage = Page.verifyOnPage(AppointmentsManagementPage)
    appointmentsManagementPage.viewAppointmentsAttendanceSummaryCard().click()

    const selectDatePage = Page.verifyOnPage(SelectDatePage)
    selectDatePage.dateChoice().find('input[value="other"]').check()
    selectDatePage.selectDatePickerDate(tomorrow)

    selectDatePage.confirmButton().click()
    const dashboardPage = Page.verifyOnPage(DashboardPage)
    dashboardPage.notRecordedStatLink().click()
    const attendancePage = Page.verifyOnPage(AttendanceData)
    attendancePage.title().contains('All not recorded yet')
    attendancePage.subTitle().contains('12 not recorded')
    attendancePage.getButton('Show filter').click()
    attendancePage.customNameFilter().type('candle')
    attendancePage.getButton('Apply filters').eq(0).click()
    attendancePage.getButton('Show filter').click()
    attendancePage.customNameFilter().should('have.value', 'candle')
    cy.location().should(loc => {
      expect(loc.search).contains('customAppointmentName=candle')
    })
  })
  it('Tier 1 data page', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.appointmentsManagementCard().click()

    const appointmentsManagementPage = Page.verifyOnPage(AppointmentsManagementPage)
    appointmentsManagementPage.viewAppointmentsAttendanceSummaryCard().click()

    const selectDatePage = Page.verifyOnPage(SelectDatePage)
    selectDatePage.dateChoice().find('input[value="other"]').check()
    selectDatePage.selectDatePickerDate(tomorrow)

    selectDatePage.confirmButton().click()
    const dashboardPage = Page.verifyOnPage(DashboardPage)
    dashboardPage.tier1StatLink().click()
    const attendancePage = Page.verifyOnPage(AttendanceData)
    attendancePage.title().contains('Tier 1 appointments')
    attendancePage.subTitle().contains('3 attendances recorded at 1 Tier 1 appointments')
  })
})
