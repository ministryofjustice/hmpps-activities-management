import Page from '../page'

export default class EndDatePage extends Page {
  constructor() {
    super('allocation-end-date-page')
  }

  selectEndDate = (endDate: Date) => this.selectDatePickerDate(endDate)
}
