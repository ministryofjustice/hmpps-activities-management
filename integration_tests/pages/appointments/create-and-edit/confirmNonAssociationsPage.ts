import Page from '../../page'

export default class ConfirmNonAssociationsPage extends Page {
  constructor() {
    super('appointment-confirm-non-associations-page')
  }

  header = () => cy.get('h1')

  bodyText = () => cy.get('.govuk-body')

  review = () => cy.get('.govuk-button--secondary').click()
}
