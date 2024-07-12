import Page from '../page'

export default class EndDecisionPage extends Page {
  constructor() {
    super('end-decision-page')
  }

  selectEndDecisionRadio = (option: string) => this.getInputByName('endDecision').check(option).click()
}
