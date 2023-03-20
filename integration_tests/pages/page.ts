import DatePicker from '../components/datePicker'
import SummaryList from '../components/summaryList'

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

  getInputById = (id: string): Cypress.Chainable => cy.get(`[id=${id}]`)

  getInputByName = (name: string): Cypress.Chainable => cy.get(`[name="${name}"]`)

  getLinkByText = text => cy.get('a').contains(text)

  continue = () => cy.get('button').contains('Continue').click()

  back = () => cy.get('.govuk-back-link').contains('Back').click()

  assertNoBackLink = () => cy.get('.govuk-back-link').should('not.exist')

  assertSummaryListValue = (listIdentifier: string, heading: string, expectedValue: string) =>
    cy
      .get(`[data-qa=${listIdentifier}] > .govuk-summary-list__row > .govuk-summary-list__key`)
      .contains(heading)
      .parent()
      .get('.govuk-summary-list__value')
      .should('contain.text', expectedValue)

  protected getDatePickerById = (id: string) => new DatePicker(id)

  protected getSummaryListById = (id: string) => new SummaryList(id)

  assertNotificationContents = (titleText, notificationText = null) => {
    cy.get('.govuk-notification-banner .govuk-notification-banner__heading').contains(titleText)

    if (notificationText) {
      cy.get('.govuk-notification-banner .govuk-notification-banner__content').contains(notificationText)
    }
  }
}
