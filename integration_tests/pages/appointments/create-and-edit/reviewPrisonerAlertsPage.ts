import Page from '../../page'

export default class ReviewPrisonerAlertsPage extends Page {
  constructor() {
    super('appointment-review-prisoner-alert-page')
  }

  assertPrisonerInList = (name: string) => cy.get('a.govuk-link--no-visited-state').contains(name).should('exist')

  assertAlertInList = (alert1: string, alert2: string, alert3: string) => {
    cy.get('.govuk-summary-card__content').within(() => {
      cy.get('.govuk-details__text ul').then($list => {
        // Assert each alert text is present
        expect($list.text()).to.include(alert1)
        expect($list.text()).to.include(alert2)
        expect($list.text()).to.include(alert3)
      })
    })
  }

  assertBadgesInList = (badge1: string, badge2: string, badge3: string) => {
    cy.get('.alerts-list li.alert-status--arsonist').contains(badge1).should('exist')

    // Assert "TACT" badge presence
    cy.get('.alerts-list li.alert-status--tact').contains(badge2).should('exist')

    // Assert "No one-to-one" badge presence
    cy.get('.alerts-list li.alert-status--no-one-to-one').contains(badge3).should('exist')
  }

  assertNoAlerts = (message: string) => {
    cy.get('div.govuk-grid-column-two-thirds').find('p.govuk-body').contains(message).should('exist')
  }
}
