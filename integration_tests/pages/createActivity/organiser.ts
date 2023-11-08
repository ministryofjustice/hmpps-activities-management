import Page from '../page'

export default class ActivityOrganiserPage extends Page {
  constructor() {
    super('organiser-page')
  }

  selectOrganiser = (organiser: string) => this.getInputByLabel(organiser).click()
}
