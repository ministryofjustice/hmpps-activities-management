import Page from '../page'

export default class ScheduleNamePage extends Page {
  constructor() {
    super('create-schedule-name-page')
  }

  enterName = (text: string) => this.getInputByName('name').type(text)
}
