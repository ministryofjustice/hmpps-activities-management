import { getDate, getMonth, getYear } from 'date-fns'
import Page from '../../page'

export default class DateAndTimePage extends Page {
  constructor() {
    super('appointment-date-and-time-page')
  }

  enterStartDate = (startDate: Date) => {
    this.getInputById('startDate-day').clear().type(getDate(startDate).toString())
    this.getInputById('startDate-month')
      .clear()
      .type((getMonth(startDate) + 1).toString())
    this.getInputById('startDate-year').clear().type(getYear(startDate).toString())
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
    this.getInputById('startDate-day').should('have.value', getDate(startDate).toString())
    this.getInputById('startDate-month').should('have.value', (getMonth(startDate) + 1).toString())
    this.getInputById('startDate-year').should('have.value', getYear(startDate).toString())
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
