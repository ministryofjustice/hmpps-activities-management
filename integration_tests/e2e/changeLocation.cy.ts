import IndexPage from '../pages/index'
import Page from '../pages/page'
import ChangeLocationPage from '../pages/changeLocation'

context('Change location', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.signIn()

    cy.stubEndpoint('PUT', '/api/users/me/activeCaseLoad')
  })

  it('should click through location change journey', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.headerActiveCaseload().should('contain.text', 'Moorland (HMP & YOI)')
    indexPage.headerChangeLocation().click()

    const changeLocationPage = Page.verifyOnPage(ChangeLocationPage)
    changeLocationPage.locationOptions().should('deep.equal', ['Leeds (HMP)', 'Moorland (HMP & YOI)'])
    changeLocationPage.selectedLocation().should('equal', 'Moorland (HMP & YOI)')
    changeLocationPage.submit().click()

    Page.verifyOnPage(IndexPage)
  })
})
