import Page from '../page'

export default class CancelPage extends Page {
  constructor() {
    super('cancel-page')
  }

  selectOption = (text: string) => this.getInputByLabel(text).click()

  confirm = () => cy.get('button').contains('Confirm').click()
}
