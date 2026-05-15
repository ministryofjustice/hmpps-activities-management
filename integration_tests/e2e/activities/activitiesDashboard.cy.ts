import IndexPage from '../../pages'
import Page from '../../pages/page'
import ActivitiesIndexPage from '../../pages/activities'
import ManageActivitiesDashboardPage from '../../pages/activities/manageActivitiesDashboard'
import getActivities from '../../fixtures/activitiesApi/getActivities.json'
import getActivitiesWithOutsideWork from '../../fixtures/activitiesApi/getActivities-withExternal.json'
import ActivitiesDashboardPage from '../../pages/activities/activitiesDashboard'

context('Activities dashboard', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
  })

  it('Shows message when no activities are available', () => {
    cy.signIn()
    cy.stubEndpoint('GET', '/prison/MDI/activities\\?excludeArchived=false', [])

    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.activitiesCard().click()

    const activitiesIndexPage = Page.verifyOnPage(ActivitiesIndexPage)
    activitiesIndexPage.allocateToActivitiesCard().click()

    const manageActivitiesPage = Page.verifyOnPage(ManageActivitiesDashboardPage)
    manageActivitiesPage.editActivityDetailsCard().click()

    const activitiesDashboardPage = Page.verifyOnPage(ActivitiesDashboardPage)
    activitiesDashboardPage.noActivitiesMessage().should('exist')
  })

  it('Shows correct dashboard for non EA prison', () => {
    cy.signIn()
    cy.stubEndpoint('GET', '/prison/MDI/activities\\?excludeArchived=false', getActivities)

    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.activitiesCard().click()

    const activitiesIndexPage = Page.verifyOnPage(ActivitiesIndexPage)
    activitiesIndexPage.allocateToActivitiesCard().click()

    const manageActivitiesPage = Page.verifyOnPage(ManageActivitiesDashboardPage)
    manageActivitiesPage.editActivityDetailsCard().click()

    const activitiesDashboardPage = Page.verifyOnPage(ActivitiesDashboardPage)
    activitiesDashboardPage.outsideWorkNavigation().should('not.exist')
    activitiesDashboardPage.inPrisonH2().should('not.exist')
    activitiesDashboardPage.outsideH2().should('not.exist')
  })

  it('Shows correct dashboard and navigation for EA prison', () => {
    cy.signInEAEnabled()
    cy.stubEndpoint('GET', '/prison/MDI/activities\\?excludeArchived=false', getActivitiesWithOutsideWork)

    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.activitiesCard().click()

    const activitiesIndexPage = Page.verifyOnPage(ActivitiesIndexPage)
    activitiesIndexPage.allocateToActivitiesCard().click()

    const manageActivitiesPage = Page.verifyOnPage(ManageActivitiesDashboardPage)
    manageActivitiesPage.editActivityDetailsCard().click()

    const activitiesDashboardPage = Page.verifyOnPage(ActivitiesDashboardPage)
    activitiesDashboardPage.outsideWorkNavigation().should('exist')
    activitiesDashboardPage.inPrisonH2().should('exist')
    activitiesDashboardPage.getActivitiesCount().should('be.greaterThan', 0)

    activitiesDashboardPage.outsideActivitiesLink().click()
    activitiesDashboardPage.outsideH2().should('exist')
    activitiesDashboardPage.getActivitiesCount().should('be.greaterThan', 0)
  })
})
