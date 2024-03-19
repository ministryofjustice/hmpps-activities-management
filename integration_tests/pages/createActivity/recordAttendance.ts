import Page from '../page'

export default class AttendanceRequired extends Page {
  constructor() {
    super('attendance-required-page')
  }

  selectRecordAttendance = (option: string) => this.getInputByLabel(option).click()
}
