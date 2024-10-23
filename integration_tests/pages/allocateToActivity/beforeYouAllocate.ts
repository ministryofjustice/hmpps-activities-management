import Page from '../page'

export default class BeforeYouAllocate extends Page {
  constructor() {
    super('before-you-allocate-page')
  }

  selectConfirmationRadio = (option: string) => this.getInputByName('confirm').check(option).click()

  nonAssociationsCountPara = (): Cypress.Chainable => cy.get('[data-qa="non-association-count-para"]')

  nonAssociationsLink = (): Cypress.Chainable => cy.get('[data-qa="non-association-link"]')

  noNonAssociationsPara = (): Cypress.Chainable => cy.get('[data-qa="no-non-associations-para"]')
}
