import Page from '../page'

export default class ScheduleFrequencyPage extends Page {
  constructor() {
    super('create-schedule-schedule-frequency-page')
  }

  selectScheduleFrequency = (text: string) => this.getInputByLabel(text).click()
}
