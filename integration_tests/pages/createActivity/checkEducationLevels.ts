import Page from '../page'

export default class CheckEducationLevelsPage extends Page {
  constructor() {
    super('check-education-levels-page')
  }

  educationLevelRows = (): Cypress.Chainable =>
    cy.get('.govuk-summary-list__row').then($el => {
      return Cypress.$.makeArray($el)
    })

  confirmEducationLevels = () => cy.get('button').contains('Confirm education levels').click()

  addAnother = () => cy.get('a').contains('Add another education level').click()
}
