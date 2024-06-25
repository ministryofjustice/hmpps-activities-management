import { addDays, subDays } from 'date-fns'

import Page from '../../pages/page'
import IndexPage from '../../pages'
import AppointmentsManagementPage from '../../pages/appointments/appointmentsManagementPage'
import SelectDatePage from '../../pages/appointments/appointments-attendance-summary/selectDate'
import DashboardPage from '../../pages/appointments/appointments-attendance-summary/dashboard'
import { formatDate } from '../../../server/utils/utils'
import getCategories from '../../fixtures/activitiesApi/getAppointmentCategories.json'
import getAppointmentAttendanceSummaries1 from '../../fixtures/activitiesApi/getAppointmentAttendanceSummaries1.json'
import getAppointmentAttendanceSummaries2 from '../../fixtures/activitiesApi/getAppointmentAttendanceSummaries2.json'

context.skip('Appointment attendancy summary statistics', () => {
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
    dashboardPage.tier1Stat().contains('2')
    dashboardPage.tier2Stat().contains('4')
    dashboardPage.foundationalStat().contains('2')
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
    dashboardPage.tier1Stat().contains('2')
    dashboardPage.tier2Stat().contains('3')
    dashboardPage.foundationalStat().contains('1')
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
})
