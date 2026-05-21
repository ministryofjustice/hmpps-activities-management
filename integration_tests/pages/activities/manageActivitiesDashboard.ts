import Page from '../page'

export default class AllocateIndexPage extends Page {
  constructor() {
    super('allocate-home')
  }

  manageAllocationsCard = (): Cypress.Chainable => cy.get('[data-qa=manage-allocations]')

  editActivityDetailsCard = (): Cypress.Chainable => cy.get('[data-qa=edit-activity-details]')

  createAnActivityCard = (): Cypress.Chainable => cy.get('[data-qa=create-an-activity]')

  viewChangesInCircumstancesCard = (): Cypress.Chainable => cy.get('[data-qa=change-of-circumstances]')

  manageApplicationsAndWaitlistsCard = (): Cypress.Chainable => cy.get('[data-qa=applications-and-waitlists]')

  manageSuspensionsCard = (): Cypress.Chainable => cy.get('[data-qa=suspensions]')

  modifyInOutCard = (): Cypress.Chainable => cy.get('[data-qa=exclusions]')
}
