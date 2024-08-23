import Page from '../page'

export default class SessionTimesPage extends Page {
  constructor() {
    super('session-times-page')
  }

  selectStartTime = (hour: number, minute: number, day: string, slot: string) => {
    this.getInputById(`startTimes-${day}-${slot}-hour`).select(hour.toString())
    this.getInputById(`startTimes-${day}-${slot}-minute`).select(minute.toString())
  }

  selectEndTime = (hour: number, minute: number, day: string, slot: string) => {
    this.getInputById(`endTimes-${day}-${slot}-hour`).select(hour.toString())
    this.getInputById(`endTimes-${day}-${slot}-minute`).select(minute.toString())
  }
}
