import Page from '../page'

export default class UncancelConfirmMultiplePage extends Page {
  constructor() {
    super('uncancel-sessions-confirm-multiple-page')
  }

  selectConfirmation = () => cy.get('button').contains('Confirm').click()
}
