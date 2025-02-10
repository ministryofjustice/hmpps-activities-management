import Page from '../page'

export default class ConfirmationPage extends Page {
  constructor() {
    super('confirmation-page', true)
  }

  panelHeader = () => cy.get('h1')

  deallocateLink = () => cy.get('li').contains('take Alfonso Cholak off').click()
}
