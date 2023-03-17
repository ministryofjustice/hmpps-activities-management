import Page from '../page'

export default class AttendanceListPage extends Page {
  constructor() {
    super('attendance-list-page')
  }

  selectPrisoner = name =>
    cy.get('#attendanceList').find('td:nth-child(3)').contains(name).parents('tr').find('td:nth-child(1) input').click()

  checkAttendanceStatus = (name, status) =>
    cy
      .get('#attendanceList')
      .find('td:nth-child(3)')
      .contains(name)
      .parents('tr')
      .find('td:nth-child(6)')
      .contains(status)

  markAsAttended = () => cy.get('button').contains('Mark as attended').click()

  markAsNotAttended = () => cy.get('button').contains('Mark as not attended').click()

  cancelSessionButton = () => cy.get('a').contains('Cancel this session')
}
