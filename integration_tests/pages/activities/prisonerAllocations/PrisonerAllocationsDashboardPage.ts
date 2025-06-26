import Page from '../../page'

export default class PrisonerAllocationsDashboardPage extends Page {
  constructor() {
    super('prisoner-allocations-dashboard')
  }

  getPrisonerName = (name: string): Cypress.Chainable => cy.contains(name)

  verifyMiniProfileDetails = (expectedDetails: { label: string; value: string }[]) => {
    cy.get('.mini-profile__details').within(() => {
      expectedDetails.forEach(({ label, value }) => {
        cy.contains('.mini-profile__detail-label', label)
          .next('.mini-profile__detail-value')
          .should('contain.text', value)
      })
    })
  }

  verifyMiniProfileLinks = (linkedLabels: string[]) => {
    cy.get('.mini-profile__details').within(() => {
      linkedLabels.forEach(label => {
        cy.contains('.mini-profile__detail-label', label)
          .next('.mini-profile__detail-value')
          .find('a')
          .should('have.attr', 'href')
      })
    })
  }
}
