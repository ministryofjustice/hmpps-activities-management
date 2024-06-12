import Page from '../page'

export default class ActivitiesIndexPage extends Page {
  constructor() {
    super('activities-index-page')
  }

  allocateToActivitiesCard = (): Cypress.Chainable =>
    cy.cardIsDisplayed(
      '[data-qa=allocate-to-activities-card]',
      'Allocate people to activities',
      'Set up and edit activities. Allocate, suspend, and remove people, and edit allocations.',
    )

  recordAttendanceCard = (): Cypress.Chainable =>
    cy.cardIsDisplayed(
      '[data-qa=record-attendance-card]',
      'Record activity attendance',
      'Mark attendance, cancel activity sessions and see daily attendance summaries.',
    )

  unlockAndMovementCard = (): Cypress.Chainable =>
    cy.cardIsDisplayed(
      '[data-qa=unlock-and-movement-card]',
      'Manage unlock and movement',
      'Create and print unlock and movement lists.',
    )
}
