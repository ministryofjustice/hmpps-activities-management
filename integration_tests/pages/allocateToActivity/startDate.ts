import Page from '../page'

export default class StartDatePage extends Page {
  constructor() {
    super('allocation-start-date-page')
  }

  getDatePicker = () => this.getDatePickerById('startDate')
}
