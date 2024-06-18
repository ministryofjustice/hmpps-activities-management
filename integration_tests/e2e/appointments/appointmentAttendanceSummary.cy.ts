import Page from '../../pages/page'
import IndexPage from '../../pages'
import AppointmentsManagementPage from '../../pages/appointments/appointmentsManagementPage'
import SelectDatePage from '../../pages/appointments/appointments-attendance-summary/selectDate'
import DashboardPage from '../../pages/appointments/appointments-attendance-summary/dashboard'

context('Appointment attendancy summary statistics', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.signIn()
  })

  it('should render the select date page', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.appointmentsManagementCard().click()

    const appointmentsManagementPage = Page.verifyOnPage(AppointmentsManagementPage)
    appointmentsManagementPage.viewAppointmentsAttendanceSummaryCard().click()

    const selectDatePage = Page.verifyOnPage(SelectDatePage)
    selectDatePage.dateChoice().find('input[value="today"]').check()

    selectDatePage.confirmButton().click()
    Page.verifyOnPage(DashboardPage)
    cy.location().should(loc => {
      expect(loc.pathname).to.eq('/appointments/attendance-summary/dashboard')
    })
  })
})
