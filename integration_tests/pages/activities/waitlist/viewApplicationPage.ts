import Page from '../../page'

export default class ViewApplicationPage extends Page {
  constructor() {
    super('view-application-page')
  }

  successBanner = (): Cypress.Chainable => cy.get('.govuk-notification-banner--success')

  checkApplicationStatus = (status: string) => {
    cy.get('.govuk-summary-list__value').eq(0).should('contain.text', status)
  }

  checkActivityRequested = (activity: string) => {
    cy.get('.govuk-summary-list__value').eq(1).should('contain.text', activity)
  }

  checkRequester = (requester: string) => {
    cy.get('.govuk-summary-list__value').eq(2).should('contain.text', requester)
  }

  checkDateOfRequest = (date: string) => {
    cy.get('.govuk-summary-list__value').eq(3).should('contain.text', date)
  }

  checkComments = (comments: string) => {
    cy.get('.govuk-summary-list__value').eq(4).should('contain.text', comments)
  }

  changeStatusLink = (): Cypress.Chainable => cy.get('a').contains('Change').first()

  reinstateLink = (): Cypress.Chainable => cy.get('a').contains('Reinstate').first()
}
