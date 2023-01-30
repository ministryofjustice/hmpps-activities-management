import Page from '../page'

export default class RiskLevelPage extends Page {
  constructor() {
    super('risk-level-page')
  }

  selectRiskLevel = (text: string) => this.getInputByLabel(text).click()
}
