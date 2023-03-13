import Page from '../../page'

export default class RepeatPeriodAndCountPage extends Page {
  constructor() {
    super('appointments-create-single-repeat-period-and-count-page')
  }

  selectRepeatPeriod = (option: string) => this.getInputByLabel(option).click()

  assertRepeatPeriod = (option: string) => this.getInputByName('repeatPeriod').should('have.value', option)

  enterRepeatCount = (count: string) => this.getInputByName('repeatCount').clear().type(count)

  assertRepeatCount = (count: string) => this.getInputByName('repeatCount').should('have.value', count)
}
