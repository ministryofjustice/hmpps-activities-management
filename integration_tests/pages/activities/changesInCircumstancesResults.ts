import Page from '../page'

export default class ChangesInCircumstancesResultsPage extends Page {
  constructor() {
    super('change-of-circumstance-page')
  }

  noDataParagraph = (): Cypress.Chainable => cy.get('[data-qa="no-data-p"]')

  noDataLink = (): Cypress.Chainable => cy.get('[data-qa="no-data-link"]')

  assertRow(rowNum, checkbox, name, location, eventTime, eventType) {
    cy.get('[data-module=activities-sticky-select] tr')
      .eq(rowNum + 1)
      .find('td')
      .then($data => {
        expect($data.get(1).innerText).to.contain(name)
        expect($data.get(2).innerText).to.contain(location)
        expect($data.get(3).innerText).to.contain(eventTime)
        expect($data.get(4).innerText).to.contain(eventType)
        cy.wrap($data.get(0))
          .find('input[type=checkbox]')
          .should(checkbox ? 'exist' : 'not.exist')
      })
  }
}
