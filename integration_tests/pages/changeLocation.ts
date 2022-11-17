import Page from './page'

export default class ChangeLocationPage extends Page {
  constructor() {
    super('change-location-page')
  }

  locationOptions = (): Cypress.Chainable =>
    cy
      .get('#changeLocationSelect')
      .find('option')
      .then($el => {
        return Cypress.$.makeArray($el).map(el => el.innerText)
      })

  selectedLocation = (): Cypress.Chainable =>
    cy
      .get('#changeLocationSelect')
      .find('option:selected')
      .then($el => {
        return Cypress.$.makeArray($el)
          .map(el => el.innerText)
          .pop()
      })

  submit = (): Cypress.Chainable => cy.get('#btnSubmit')
}
