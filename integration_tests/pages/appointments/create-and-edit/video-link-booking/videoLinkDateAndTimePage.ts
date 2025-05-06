import Page from '../../../page'
import { formatDatePickerDate } from '../../../../../server/utils/datePickerUtils'
import { YesNo } from '../../../../../server/@types/activities'

export default class VideoLinkDateAndTimePage extends Page {
  constructor() {
    super('date-and-time-page')
  }

  enterDate = (date: Date) => {
    this.getInputById('date').clear().type(formatDatePickerDate(date))
  }

  selectDate = (date: Date) => this.selectDatePickerDate(date)

  selectStartTime = (hour: number, minute: number) => {
    this.getInputById('startTime-hour').select(hour.toString())
    this.getInputById('startTime-minute').select(minute.toString())
  }

  selectEndTime = (hour: number, minute: number) => {
    this.getInputById('endTime-hour').select(hour.toString())
    this.getInputById('endTime-minute').select(minute.toString())
  }

  preCourtHearing = (value: YesNo) => this.getInputByName('preRequired').check(value)

  postCourtHearing = (value: YesNo) => this.getInputByName('postRequired').check(value)

  assertStartTime = (hour: number, minute: number) => {
    this.getInputById('startTime-hour').should('have.value', hour.toString())
    this.getInputById('startTime-minute').should('have.value', minute.toString())
  }

  assertEndTime = (hour: number, minute: number) => {
    this.getInputById('endTime-hour').should('have.value', hour.toString())
    this.getInputById('endTime-minute').should('have.value', minute.toString())
  }
}
