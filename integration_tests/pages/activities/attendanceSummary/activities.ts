import Page from '../../page'

export default class ActivitiesPage extends Page {
  constructor() {
    super('activities-page')
  }

  assertRow(session, activityName, scheduled, attended, notRecorded, notAttended) {
    cy.get(`[data-qa=table-session-${session}]`)
      .contains('tr', activityName)
      .find('*[id^="scheduled"]')
      .contains(scheduled)
      .siblings('*[id^="attended"]')
      .contains(attended)
      .siblings('*[id^="notRecorded"]')
      .contains(notRecorded)
      .siblings('*[id^="notAttended"]')
      .contains(notAttended)
  }
}
