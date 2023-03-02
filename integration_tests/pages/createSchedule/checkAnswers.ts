import Page from '../page'

export default class CheckAnswersPage extends Page {
  constructor() {
    super('schedule-check-answers-page')
  }

  getScheduleDetailsList = () => this.getSummaryListById('scheduleDetailsList')

  getDatesAndScheduleList = () => this.getSummaryListById('datesAndScheduleList')

  getActivityDetailsList = () => this.getSummaryListById('activityDetailsList')

  createScheduleButton = () => cy.get('button').contains('Create schedule')
}
