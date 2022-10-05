import Page, { PageElement } from './page'

export default class ChangeLocationPage extends Page {
  constructor() {
    super('change-location-page')
  }

  locationOptions = (): Cypress.Chainable<string[]> =>
    cy
      .get('#changeLocationSelect')
      .find('option')
      .then($el => {
        return Cypress.$.makeArray($el).map(el => el.innerText)
      })

  selectedLocation = (): Cypress.Chainable<string> =>
    cy
      .get('#changeLocationSelect')
      .find('option:selected')
      .then($el => {
        return Cypress.$.makeArray($el)
          .map(el => el.innerText)
          .pop()
      })

  submit = (): PageElement => cy.get('#btnSubmit')
}
