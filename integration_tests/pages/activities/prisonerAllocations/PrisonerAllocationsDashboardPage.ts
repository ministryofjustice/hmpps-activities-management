import Page from '../../page'

export default class PrisonerAllocationsDashboardPage extends Page {
  constructor() {
    super('prisoner-allocations-dashboard')
  }

  getPrisonerName = (name: string): Cypress.Chainable => cy.contains(name)

  rows = (applicationId: string): Cypress.Chainable =>
    cy
      .get(`[data-qa="${applicationId}"]`)
      .find('.govuk-table__body')
      .find('tr')
      .then($el => {
        return Cypress.$.makeArray($el)
      })

  checkTableCell = (table, cellNumber, contents) => {
    cy.get(`[data-qa=${table}]`)
      .find('td')
      .then($data => expect($data.get(cellNumber).innerText).to.contain(contents))
  }

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
