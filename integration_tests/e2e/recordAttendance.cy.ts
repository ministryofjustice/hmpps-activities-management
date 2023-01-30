import { format } from 'date-fns'
import IndexPage from '../pages/index'
import Page from '../pages/page'
import SelectPeriodPage from '../pages/recordAttendance/selectPeriod'
import ActivitiesPage from '../pages/recordAttendance/activitiesPage'
import AttendanceListPage from '../pages/recordAttendance/attendanceList'

context('Record attendance', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubPrisonUser')

    // TODO: The following stubs should be refactored to use cy.stubEndpoint()
    cy.task('stubGetPrisonScheduledActivities', 'MDI')
    cy.task('stubGetScheduledActivityById')
    cy.task('stubGetInmateDetails')

    cy.signIn()
  })

  it('should click through record attendance journey', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage
      .recordAttendanceCard()
      .should('contain.text', 'Mark attendance at activities and appointments and get printable attendance lists.')
    indexPage.recordAttendanceCard().click()

    const selectPeriodPage = Page.verifyOnPage(SelectPeriodPage)
    selectPeriodPage.enterDate(format(new Date(), 'yyyy-MM-dd'))
    selectPeriodPage.selectTimePeriod('Morning (AM)')
    selectPeriodPage.submit()

    const activitiesPage = Page.verifyOnPage(ActivitiesPage)
    activitiesPage.activityRows().should('have.length', 1)
    activitiesPage.selectActivityWithName('English level 1')

    Page.verifyOnPage(AttendanceListPage)
  })
})
