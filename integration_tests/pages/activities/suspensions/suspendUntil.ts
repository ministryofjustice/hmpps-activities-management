import Page from '../../page'

export default class SuspendUntilPage extends Page {
  constructor() {
    super('suspend-until-page')
  }

  selectRadio = (option: string) => this.getInputByName('datePresetOption').check(option).click()
}
