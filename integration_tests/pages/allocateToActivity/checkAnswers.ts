import Page from '../page'

export default class CheckAnswersPage extends Page {
  constructor() {
    super('check-answers-page')
  }

  confirmAllocation = () => cy.get('button').contains('Confirm and allocate').click()

  cancel = () => cy.get('a').contains('Cancel and return to the list of candidates').click()
}
