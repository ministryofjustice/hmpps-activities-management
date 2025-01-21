import Page from '../../page'

export default class EditAttendancePage extends Page {
  constructor() {
    super('appointment-edit-attendance-page')
  }

  mainCaption = (): Cypress.Chainable => cy.get('[data-qa=caption]')

  title = (): Cypress.Chainable => cy.get('.govuk-heading-l')

  summary = (): Cypress.Chainable => cy.get('[data-qa=summary]')

  question = (): Cypress.Chainable => cy.get('h2')

  selectYes = () => cy.get('[value=yes]').click()

  selectNo = () => cy.get('[value=no]').click()

  selectReset = () => cy.get('[value=reset]').click()
}
