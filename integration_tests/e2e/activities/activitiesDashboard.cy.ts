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
    cy.visit('/activities/dashboard')

    const activitiesDashboardPage = Page.verifyOnPage(ActivitiesDashboardPage)
    activitiesDashboardPage.noActivitiesMessage().should('exist')
  })

  it('Shows correct dashboard for non EA prison', () => {
    cy.signIn()
    cy.stubEndpoint('GET', '/prison/MDI/activities\\?excludeArchived=false', getActivities)
    cy.visit('/activities/dashboard')

    const activitiesDashboardPage = Page.verifyOnPage(ActivitiesDashboardPage)
    activitiesDashboardPage.hasInPrisonContent()
  })

  it('Shows correct dashboard and navigation for EA prison', () => {
    cy.signInEAEnabled()
    cy.stubEndpoint('GET', '/prison/MDI/activities\\?excludeArchived=false', getActivitiesWithOutsideWork)
    cy.visit('/activities/dashboard')
    
    const activitiesDashboardPage = Page.verifyOnPage(ActivitiesDashboardPage)
    activitiesDashboardPage.hasOutsideWorkContent()
    activitiesDashboardPage.locationHeading().should('contain', 'In-prison')
    activitiesDashboardPage.getActivitiesCount().should('be.greaterThan', 0)

    activitiesDashboardPage.outsideActivitiesLink().click()
    activitiesDashboardPage.locationHeading().should('contain', 'Outside')
    activitiesDashboardPage.getActivitiesCount().should('be.greaterThan', 0)
  })
})
