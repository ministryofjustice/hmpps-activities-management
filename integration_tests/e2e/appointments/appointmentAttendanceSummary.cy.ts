import { addDays, subDays } from 'date-fns'

import Page from '../../pages/page'
import IndexPage from '../../pages'
import AppointmentsManagementPage from '../../pages/appointments/appointmentsManagementPage'
import SelectDatePage from '../../pages/appointments/appointments-attendance-summary/selectDate'
import DashboardPage from '../../pages/appointments/appointments-attendance-summary/dashboard'
import { formatDate } from '../../../server/utils/utils'

context('Appointment attendancy summary statistics', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.signIn()
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
    const now = new Date()
    const today = formatDate(now)
    dashboardPage.dateCaption().contains(today)
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
    const yesterday = subDays(new Date(), 1)
    const yesterdayFormatted = formatDate(yesterday)
    dashboardPage.dateCaption().contains(yesterdayFormatted)
  })
  it('should render the select date page - chosen date', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.appointmentsManagementCard().click()

    const appointmentsManagementPage = Page.verifyOnPage(AppointmentsManagementPage)
    appointmentsManagementPage.viewAppointmentsAttendanceSummaryCard().click()

    const tomorrow = addDays(new Date(), 1)
    const selectDatePage = Page.verifyOnPage(SelectDatePage)
    selectDatePage.dateChoice().find('input[value="other"]').check()
    selectDatePage.selectDatePickerDate(tomorrow)

    selectDatePage.confirmButton().click()
    const dashboardPage = Page.verifyOnPage(DashboardPage)
    cy.location().should(loc => {
      expect(loc.pathname).to.eq('/appointments/attendance-summary/dashboard')
    })

    const tomorrowFormatted = formatDate(tomorrow)
    dashboardPage.dateCaption().contains(tomorrowFormatted)
  })
})
