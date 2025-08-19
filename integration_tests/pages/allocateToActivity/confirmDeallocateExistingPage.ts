import Page from '../page'

export default class ConfirmDeallocateExisting extends Page {
  constructor() {
    super('confirmation-page')
  }

  panelHeader = () => cy.get('h1')
}
