import Page from '../page'

export default class SessionTimesPage extends Page {
  constructor() {
    super('session-times-page')
  }

  checkTableRow = (
    week: string,
    day: string,
    session: string,
    cellIndex: number,
    startHour,
    startMinute,
    endHour,
    endMinute,
  ) => {
    cy.get('[data-qa="session-times-table"]')
      .find('td')
      .then($data => {
        expect($data.get(cellIndex).innerText).to.contain(day)
        expect($data.get(cellIndex + 1).innerText).to.contain(session)
      })
    this.getInputById(`startTimes-${week}-${day.toUpperCase()}-${session}-hour`).should('contain', startHour)
    this.getInputById(`startTimes-${week}-${day.toUpperCase()}-${session}-minute`).should('contain', startMinute)
    this.getInputById(`endTimes-${week}-${day.toUpperCase()}-${session}-hour`).should('contain', endHour)
    this.getInputById(`endTimes-${week}-${day.toUpperCase()}-${session}-minute`).should('contain', endMinute)
  }

  checkTime = (
    startHour: string,
    startMinute: string,
    endHour: string,
    endMinute: string,
    week: string,
    day: string,
    slot: string,
  ) => {
    this.getInputById(`startTimes-${week}-${day}-${slot}-hour`).should('contain', startHour)
    this.getInputById(`startTimes-${week}-${day}-${slot}-minute`).should('contain', startMinute)
    this.getInputById(`endTimes-${week}-${day}-${slot}-hour`).should('contain', endHour)
    this.getInputById(`endTimes-${week}-${day}-${slot}-minute`).should('contain', endMinute)
  }

  clearTime = (week: string, day: string, slot: string) => {
    this.getInputById(`startTimes-${week}-${day}-${slot}-hour`).select('--')
    this.getInputById(`startTimes-${week}-${day}-${slot}-minute`).select('--')
    this.getInputById(`endTimes-${week}-${day}-${slot}-hour`).select('--')
    this.getInputById(`endTimes-${week}-${day}-${slot}-minute`).select('--')
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
