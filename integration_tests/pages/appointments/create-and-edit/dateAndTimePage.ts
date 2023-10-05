import Page from '../../page'
import { formatDatePickerDate } from '../../../../server/utils/datePickerUtils'

export default class DateAndTimePage extends Page {
  constructor() {
    super('appointment-date-and-time-page')
  }

  enterStartDate = (startDate: Date) => {
    this.getInputById('startDate').clear().type(formatDatePickerDate(startDate))
  }

  selectStartTime = (hour: number, minute: number) => {
    this.getInputById('startTime-hour').select(hour.toString())
    this.getInputById('startTime-minute').select(minute.toString())
  }

  selectEndTime = (hour: number, minute: number) => {
    this.getInputById('endTime-hour').select(hour.toString())
    this.getInputById('endTime-minute').select(minute.toString())
  }

  assertStartDate = (startDate: Date) => {
    this.getInputById('startDate').should('have.value', formatDatePickerDate(startDate))
  }

  assertStartTime = (hour: number, minute: number) => {
    this.getInputById('startTime-hour').should('have.value', hour.toString())
    this.getInputById('startTime-minute').should('have.value', minute.toString())
  }

  assertEndTime = (hour: number, minute: number) => {
    this.getInputById('endTime-hour').should('have.value', hour.toString())
    this.getInputById('endTime-minute').should('have.value', minute.toString())
  }
}
