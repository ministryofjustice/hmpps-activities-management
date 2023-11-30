import Page from '../page'

export default class CheckAnswersPage extends Page {
  constructor() {
    super('check-answers-page')
  }

  confirmAllocation = () => cy.get('button').contains('Confirm this allocation').click()

  confirmDeallocation = () => cy.get('button').contains('Confirm and remove').click()

  cancel = () => cy.get('a').contains('Cancel and return to the list of candidates').click()
}
