import Page, { PageElement } from './page'

export default class ChangeLocationPage extends Page {
  constructor() {
    super('change-location-page')
  }

  caseLoadOptions = (): Cypress.Chainable<string[]> =>
    cy
      .get('#changeCaseloadSelect')
      .find('option')
      .then($el => {
        return Cypress.$.makeArray($el).map(el => el.innerText)
      })

  submit = (): PageElement => cy.get('#btnSubmit')
}
