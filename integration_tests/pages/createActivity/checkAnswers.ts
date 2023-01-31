import Page from '../page'

export default class CheckAnswersPage extends Page {
  constructor() {
    super('check-answers-page')
  }

  createActivity = () => cy.get('button').contains('Create activity').click()
}
