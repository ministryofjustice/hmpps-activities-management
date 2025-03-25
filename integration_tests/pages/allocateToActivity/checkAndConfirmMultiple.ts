import Page from '../page'

export default class CheckAndConfirmMultiplePage extends Page {
  constructor() {
    super('check-and-confirm-multiple-page')
  }

  selectConfirm = (text: string) => cy.get('button').contains(text)
}
