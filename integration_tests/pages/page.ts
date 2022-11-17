export default abstract class Page {
  static verifyOnPage<T>(constructor: new () => T): T {
    return new constructor()
  }

  protected constructor(private readonly pageId: string, private readonly pauseAxeOnThisPage = false) {
    this.checkOnPage()

    if (!pauseAxeOnThisPage) {
      cy.injectAxe()
      cy.checkA11y()
    }
  }

  checkOnPage = (): void => {
    cy.get(`#${this.pageId}`).should('exist')
  }

  signOut = (): Cypress.Chainable => cy.get('[data-qa=signOut]')

  manageDetails = (): Cypress.Chainable => cy.get('[data-qa=manageDetails]')

  headerUserName = (): Cypress.Chainable => cy.get('[data-qa=header-user-name]')

  headerActiveCaseload = (): Cypress.Chainable => cy.get('[data-qa=header-active-caseload]')

  headerChangeLocation = (): Cypress.Chainable => cy.get('[data-qa=header-change-location]')
}
