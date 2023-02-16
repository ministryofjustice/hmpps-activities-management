import Page from '../../page'

export default class ConfirmationPage extends Page {
  constructor() {
    super('appointments-create-single-confirmation-page')
  }

  assertMessageEquals = (message: string) => cy.get('[data-qa=message]').contains(message)
}
