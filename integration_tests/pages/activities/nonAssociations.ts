import Page from '../page'

export default class NonAssociationsPage extends Page {
  constructor() {
    super('non-associations-page')
  }

  caption = (): Cypress.Chainable => cy.get('[data-qa=caption]')

  title = (): Cypress.Chainable => cy.get('[data-qa=title]')

  para1 = (): Cypress.Chainable => cy.get('[data-qa=para1]')

  naActivityTable = (): Cypress.Chainable => cy.get('[data-qa=na-table]').eq(0)

  naPrisonTable = (): Cypress.Chainable => cy.get('[data-qa=na-table]').eq(1)

  NoNaActivity = (): Cypress.Chainable => cy.get('[data-qa=noNA-activity]')

  NoNaPrison = (): Cypress.Chainable => cy.get('[data-qa=noNA-prison]')

  allocationLink = (activityId: number): Cypress.Chainable => cy.get(`[data-qa=allocation-${activityId}]`)
}
