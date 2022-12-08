import IndexPage from '../pages/index'
import Page from '../pages/page'
import CategoriesDashboardPage from '../pages/allocateToActivity/categoriesDashboard'
import ActivitiesDashboardPage from '../pages/allocateToActivity/activitiesDashboard'
import SchedulesDashboardPage from '../pages/allocateToActivity/schedulesDashboard'

context('Change location', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubPrisonUser')
    cy.task('stubGetCategories')
    cy.task('stubGetCategoryCapacity', 'LEI')
    cy.task('stubGetActivitiesForCategory', 'LEI')
    cy.task('stubGetActivityCapacity')
    cy.task('stubGetActivitySchedules')
    cy.task('stubGetScheduleCapacity')
    cy.signIn()
  })

  it('should click through allocate to activity journey', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.allocateToActivityCard().should('contain.text', 'Allocate an inmate to an activity schedule.')
    indexPage.allocateToActivityCard().click()

    const categoriesPage = Page.verifyOnPage(CategoriesDashboardPage)
    categoriesPage.categoryRows().should('have.length', 4)
    categoriesPage.selectCategoryWithName('Education')

    const activitiesPage = Page.verifyOnPage(ActivitiesDashboardPage)
    activitiesPage.activityRows().should('have.length', 2)
    activitiesPage.selectActivityWithName('English level 1')

    const schedulesPage = Page.verifyOnPage(SchedulesDashboardPage)
    schedulesPage.scheduleRows().should('have.length', 4)
  })
})
