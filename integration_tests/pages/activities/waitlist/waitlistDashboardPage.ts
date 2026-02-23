import Page from '../../page'

export default class WaitlistDashboardPage extends Page {
  constructor() {
    super('applications-and-waitlists-page')
  }

  selectFirstApplication = () => {
    cy.get('.govuk-table__body .govuk-table__row').first().find('.govuk-table__cell').eq(0).click()
  }

  checkPrisonerDetails = (activityName: string) => {
    cy.get('.govuk-table__body .govuk-table__row')
      .first()
      .find('.govuk-table__cell')
      .eq(1)
      .should('contain.text', activityName)
  }

  checkActivityName = (activityName: string) => {
    cy.get('.govuk-table__body .govuk-table__row')
      .first()
      .find('.govuk-table__cell')
      .eq(2)
      .should('contain.text', activityName)
  }

  checkActivityLink = (activityName: string) => {
    cy.get('[data-qa="activity-waitlist-link"]')
      .contains(activityName)
      .should('have.attr', 'href')
      .and('include', '1#waitlist-tab')
  }

  checkRequestData = (requestData: string) => {
    cy.get('.govuk-table__body .govuk-table__row')
      .first()
      .find('.govuk-table__cell')
      .eq(3)
      .should('contain.text', requestData)
  }

  checkEarliestReleaseDate = (releaseDate: string) => {
    cy.get('.govuk-table__body .govuk-table__row')
      .first()
      .find('.govuk-table__cell')
      .eq(4)
      .should('contain.text', releaseDate)
  }

  checkApplicationStatus = (status: string) => {
    cy.get('.govuk-table__body .govuk-table__row')
      .first()
      .find('.govuk-table__cell')
      .eq(5)
      .should('contain.text', status)
  }

  viewApplication = (): Cypress.Chainable => {
    return cy.get('#waitlist-action-0').first().click({ force: true })
  }
}
