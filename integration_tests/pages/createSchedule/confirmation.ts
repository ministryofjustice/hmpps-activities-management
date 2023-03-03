import Page from '../page'

export default class ConfirmationPage extends Page {
  constructor() {
    super('create-schedule-confirmation-page')
  }

  assertSuccessMessage = text => cy.get('#createScheduleSuccessText').contains(text)
}
