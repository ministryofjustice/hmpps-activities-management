import Page from '../page'

export default class UnlockAndMovementIndexPage extends Page {
  constructor() {
    super('unlock-list-home')
  }

  createUnlockListsCard = (): Cypress.Chainable => cy.get('[data-qa=create-unlock-lists]')
}
