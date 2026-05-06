import Page from '../page'

export default class AddToSessionsTodayPage extends Page {
  constructor() {
    super('exclusions-add-to-todays-sessions-page')
  }

  pageTitle = (): Cypress.Chainable => cy.get('h1.govuk-heading-l')

  selectOption = (option: 'yes' | 'no'): Cypress.Chainable => {
    return cy.get(`input[value="${option}"]`).click()
  }

  continue = (): void => {
    cy.get('button[type="submit"]').click()
  }
}
