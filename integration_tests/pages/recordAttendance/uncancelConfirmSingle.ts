import Page from '../page'

export default class UncancelConfirmSinglePage extends Page {
  constructor() {
    super('uncancel-sessions-confirm-single-page')
  }

  selectConfirmation = () => cy.get('button').contains('Confirm').click()
}
