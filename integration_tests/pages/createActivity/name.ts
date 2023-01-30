import Page from '../page'

export default class ActivityNamePage extends Page {
  constructor() {
    super('name-page')
  }

  enterName = (text: string) => this.getInputByName('name').type(text)
}
