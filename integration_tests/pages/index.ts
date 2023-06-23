import Page from './page'

export default class IndexPage extends Page {
  constructor() {
    super('index-page')
  }

  activitiesCard = (): Cypress.Chainable => cy.get('[data-qa=activities-card]')

  appointmentsManagementCard = (): Cypress.Chainable => cy.get('[data-qa=appointments-card]')
}
