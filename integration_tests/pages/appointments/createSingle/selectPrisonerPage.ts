import Page from '../../page'

export default class SelectPrisonerPage extends Page {
  constructor() {
    super('appointments-create-single-select-prisoner-page')
  }

  enterPrisonerNumber = (prisonerNumber: string) => this.getInputByName('number').type(prisonerNumber)
}
