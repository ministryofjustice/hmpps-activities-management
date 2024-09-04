import Page from '../page'

export default class SessionTimesPage extends Page {
  constructor() {
    super('session-times-page')
  }

  checkTableRow = (day: string, session: string, cellIndex: number, startHour, startMinute, endHour, endMinute) => {
    cy.get('[data-qa="session-times-table"]')
      .find('td')
      .then($data => {
        expect($data.get(cellIndex).innerText).to.contain(day)
        expect($data.get(cellIndex + 1).innerText).to.contain(session)
      })
    this.getInputById(`startTimes-${day.toUpperCase()}-${session}-hour`).should('contain', startHour)
    this.getInputById(`startTimes-${day.toUpperCase()}-${session}-minute`).should('contain', startMinute)
    this.getInputById(`endTimes-${day.toUpperCase()}-${session}-hour`).should('contain', endHour)
    this.getInputById(`endTimes-${day.toUpperCase()}-${session}-minute`).should('contain', endMinute)
  }

  checkTime = (
    startHour: string,
    startMinute: string,
    endHour: string,
    endMinute: string,
    day: string,
    slot: string,
  ) => {
    this.getInputById(`startTimes-${day}-${slot}-hour`).should('contain', startHour)
    this.getInputById(`startTimes-${day}-${slot}-minute`).should('contain', startMinute)
    this.getInputById(`endTimes-${day}-${slot}-hour`).should('contain', endHour)
    this.getInputById(`endTimes-${day}-${slot}-minute`).should('contain', endMinute)
  }

  clearTime = (day: string, slot: string) => {
    this.getInputById(`startTimes-${day}-${slot}-hour`).select('--')
    this.getInputById(`startTimes-${day}-${slot}-minute`).select('--')
    this.getInputById(`endTimes-${day}-${slot}-hour`).select('--')
    this.getInputById(`endTimes-${day}-${slot}-minute`).select('--')
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
