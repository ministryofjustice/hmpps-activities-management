import Page from './page'

export default class IndexPage extends Page {
  constructor() {
    super('index-page')
  }

  activitiesCard = (): Cypress.Chainable => cy.get('[data-qa=activities-card]')

  appointmentsManagementCard = (): Cypress.Chainable =>
    cy.cardIsDisplayed(
      '[data-qa=appointments-card]',
      'Appointments scheduling and attendance',
      'Create, manage and edit appointments. Print movement slips. Record appointment attendance.',
    )
}
