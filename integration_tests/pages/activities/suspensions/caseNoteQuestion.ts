import Page from '../../page'

export default class CaseNoteQuestionPage extends Page {
  constructor() {
    super('case-note-question-page')
  }

  title = (): Cypress.Chainable => cy.get('h1')

  selectRadio = (option: string) => this.getInputByName('choice').check(option).click()
}
