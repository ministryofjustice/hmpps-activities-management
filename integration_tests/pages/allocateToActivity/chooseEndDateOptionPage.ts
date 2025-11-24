import Page from '../page'

export default class ChooseEndDateOptionPage extends Page {
  constructor() {
    super('deallocation-choose-end-date-option-page')
  }

  panelHeader = () => cy.get('h1')

  selectEndDateOption = (text: string) => this.getInputByLabel(text).click()
}
