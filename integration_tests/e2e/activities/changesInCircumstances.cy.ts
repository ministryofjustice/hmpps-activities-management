import { format } from 'date-fns'
import IndexPage from '../../pages'
import Page from '../../pages/page'
import ActivitiesIndexPage from '../../pages/activities'
import ManageActivitiesDashboardPage from '../../pages/activities/manageActivitiesDashboard'
import ChangesInCircumstancesDatePage from '../../pages/activities/changesInCircumstancesDate'
import ChangesInCircumstancesResultsPage from '../../pages/activities/changesInCircumstancesResults'

const inmateDetails = [
  {
    prisonerNumber: 'A1234AA',
    cellLocation: '1-12-123',
    firstName: 'Bob',
    lastName: 'Bobson',
    dateOfBirth: '11-02-1976',
  },
]

context('Changes in circumstances', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.signIn()
    cy.stubEndpoint('POST', '/prisoner-search/prisoner-numbers', inmateDetails)
    // cy.stubEndpoint('GET', `/event-review/prison/MDI\\?date=${date}&page=0&size=10`, getChangeEvents)
  })
  it('Shows correct message if there is no data for today', () => {
    const date = format(new Date(), 'yyyy-MM-dd')
    cy.stubEndpoint('GET', `/event-review/prison/MDI\\?date=${date}&page=0&size=10`, {
      content: [],
      totalElements: 0,
      totalPages: 0,
      pageNumber: 0,
    } as unknown as JSON)
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.activitiesCard().click()
    const activitiesIndexPage = Page.verifyOnPage(ActivitiesIndexPage)
    activitiesIndexPage.allocateToActivitiesCard().click()
    const manageActivitiesPage = Page.verifyOnPage(ManageActivitiesDashboardPage)
    manageActivitiesPage.changesInCircumstancesCard().click()
    const changesInCircumstancesDatePage = Page.verifyOnPage(ChangesInCircumstancesDatePage)
    changesInCircumstancesDatePage.datePresetOption().should('exist')
    changesInCircumstancesDatePage.radioTodayClick()
    changesInCircumstancesDatePage.submit()
    const changesInCircumstancesResultsPage = Page.verifyOnPage(ChangesInCircumstancesResultsPage)
    changesInCircumstancesResultsPage
      .noDataParagraph()
      .should('contain.text', 'There are no changes to show for today.')
    changesInCircumstancesResultsPage.noDataLink().should('exist')
    changesInCircumstancesResultsPage.noDataLink().click()
    cy.location().should(loc => {
      expect(loc.pathname).to.eq('/activities/change-of-circumstances/select-period')
    })
  })
})
