import Page from './page'

export default class IndexPage extends Page {
  constructor() {
    super('index-page')
  }

  activitiesCard = (): Cypress.Chainable =>
    cy.cardIsDisplayed(
      '[data-qa=activities-card]',
      'Activities, unlock and attendance',
      'Create and edit activities. Allocate people and edit allocations. Manage waitlists and applications. Print unlock lists and record activity attendance.',
    )

  appointmentsManagementCard = (): Cypress.Chainable =>
    cy.cardIsDisplayed(
      '[data-qa=appointments-card]',
      'Appointments',
      'Create, manage and edit appointments. Print movement slips. Record appointment attendance.',
    )
}
