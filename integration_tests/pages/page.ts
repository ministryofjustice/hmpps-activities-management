export default abstract class Page {
  static verifyOnPage<T>(constructor: new () => T): T {
    return new constructor()
  }

  protected constructor(private readonly pageId: string, private readonly pauseAxeOnThisPage = false) {
    this.checkOnPage()

    if (!pauseAxeOnThisPage) {
      cy.injectAxe()
      cy.configureAxe({
        // These disabled rules suppress only common upstream GOVUK Design System behaviours:
        rules: [
          // aria-allowed-attr is disabled because radio buttons can have aria-expanded which isn't
          // currently allowed by the spec, but that might change: https://github.com/w3c/aria/issues/1404
          { id: 'aria-allowed-attr', enabled: false },
        ],
      })
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

  getInputByLabel = (label: string): Cypress.Chainable =>
    cy
      .contains('label', label)
      .invoke('attr', 'for')
      .then(id => {
        cy.get(`#${id}`)
      })
}
