import Page from '../../page'

export default class ViewSuspensionPage extends Page {
  constructor() {
    super('view-suspensions-page')
  }

  summary = (): Cypress.Chainable => cy.get('[data-qa="suspension-summary"]')

  endSuspensionButton = (): Cypress.Chainable => cy.get('a').contains('End suspension').click()

  endAllSuspensionButton = (): Cypress.Chainable => cy.get('a').contains('End all suspensions').click()
}
