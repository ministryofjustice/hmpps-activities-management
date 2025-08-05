import Page from '../../page'

export default class WaitListAllocationPage extends Page {
  constructor() {
    super('Waitlist-Options')
  }

  getAllocateToActivityCaption = (): Cypress.Chainable => cy.contains('span.govuk-caption-l', 'Allocate to an activity')

  selectRadioByLabel(labelText: string) {
    cy.contains('.govuk-radios__item', labelText).find('input[type="radio"]').check()
  }
}
