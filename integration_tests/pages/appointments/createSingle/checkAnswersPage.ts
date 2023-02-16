import Page from '../../page'

export default class CheckAnswersPage extends Page {
  constructor() {
    super('appointments-create-single-check-answers-page')
  }

  createAppointment = () => cy.get('button').contains('Accept and save').click()
}
