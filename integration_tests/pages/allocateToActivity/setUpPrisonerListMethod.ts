import Page from '../page'

export default class SetUpPrisonerListMethodPage extends Page {
  constructor() {
    super('activities-allocate-multiple-set-up-list-page')
  }

  caption = (): Cypress.Chainable => cy.get('.govuk-caption-xl')

  selectHowToAddDecisionRadio = (option: string) => this.getInputByName('howToAdd').check(option).click()
}
