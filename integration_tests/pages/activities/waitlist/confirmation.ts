import Page from '../../page'

export default class ConfirmationPage extends Page {
  constructor() {
    super('confirmation-page')
  }

  panelHeader = () => cy.get('h1')

  panelText = () => cy.get('.govuk-panel__body')
}
