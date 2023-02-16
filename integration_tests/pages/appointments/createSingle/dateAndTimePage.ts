import { getDate, getMonth, getYear } from 'date-fns'
import Page from '../../page'

export default class DateAndTimePage extends Page {
  constructor() {
    super('appointments-create-single-date-and-time-page')
  }

  enterStartDate = (startDate: Date) => {
    this.getInputById('startDate-day').type(getDate(startDate).toString())
    this.getInputById('startDate-month').type((getMonth(startDate) + 1).toString())
    this.getInputById('startDate-year').type(getYear(startDate).toString())
  }

  selectStartTime = (hour: number, minute: number) => {
    this.getInputById('startTime-hour').select(hour.toString())
    this.getInputById('startTime-minute').select(minute.toString())
  }

  selectEndTime = (hour: number, minute: number) => {
    this.getInputById('endTime-hour').select(hour.toString())
    this.getInputById('endTime-minute').select(minute.toString())
  }
}
