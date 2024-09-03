import Page from '../page'

export default class SessionTimesPage extends Page {
  constructor() {
    super('session-times-page')
  }

  selectStartTime = (hour: number, minute: number, week: string, day: string, slot: string) => {
    this.getInputById(`startTimes-${week}-${day}-${slot}-hour`).select(hour.toString())
    this.getInputById(`startTimes-${week}-${day}-${slot}-minute`).select(minute.toString())
  }

  selectEndTime = (hour: number, minute: number, week: string, day: string, slot: string) => {
    this.getInputById(`endTimes-${week}-${day}-${slot}-hour`).select(hour.toString())
    this.getInputById(`endTimes-${week}-${day}-${slot}-minute`).select(minute.toString())
  }
}
