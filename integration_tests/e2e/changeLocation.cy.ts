import IndexPage from '../pages/index'
import Page from '../pages/page'
import ChangeLocationPage from '../pages/changeLocationPage'

context('Change location', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubPrisonUser')
    cy.task('stubSetActiveCaseload')
    cy.signIn()
  })

  it('should click through location change journey', () => {
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.headerActiveCaseload().should('contain.text', 'Leeds (HMP)')
    indexPage.headerChangeLocation().click()
    const changeLocationPage = Page.verifyOnPage(ChangeLocationPage)
    changeLocationPage.caseLoadOptions().should('deep.equal', ['Leeds (HMP)', 'Moorland (HMP & YOI)'])
    changeLocationPage.submit().click()
    Page.verifyOnPage(IndexPage)
  })
})
