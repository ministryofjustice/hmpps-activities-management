import Page from '../../page'

export const catABadge = { clazz: 'cat-a-status--a', text: 'CAT A' }
export const arsonistBadge = { clazz: 'alert-status--arsonist', text: 'Arsonist' }
export const tactBadge = { clazz: 'alert-status--tact', text: 'TACT' }
export const noOneToOneBadge = { clazz: 'alert-status--no-one-to-one', text: 'No one-to-one' }

export default class ReviewPrisonerAlertsPage extends Page {
  constructor() {
    super('appointment-review-prisoner-alert-page')
  }

  assertPrisonerInList = (name: string) => cy.get('a.govuk-link--no-visited-state').contains(name).should('exist')

  assertBadges(...expectedBadges) {
    cy.get('.alerts-list li')
      .should('have.length', expectedBadges.length)
      .each((item, index) => {
        cy.wrap(item)
          .should('contain.text', expectedBadges[index].text)
          .should('have.class', `${expectedBadges[index].clazz}`)
      })
  }

  assertAlertDescriptions(...expectedAlertDescriptions) {
    cy.get('[data-qa=alert-descriptions] li')
      .should('have.length', expectedAlertDescriptions.length)
      .each((item, index) => {
        cy.wrap(item).should('contain.text', expectedAlertDescriptions[index])
      })
  }

  assertNoAlerts = (message: string) => {
    cy.get('div.govuk-grid-column-two-thirds').find('p.govuk-body').contains(message).should('exist')
  }
}
