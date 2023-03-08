import Page from '../page'

export default class AttendanceListPage extends Page {
  constructor() {
    super('attendance-list-page')
  }

  selectPrisoner = name =>
    cy.get('#attendanceList').find('td:nth-child(2)').contains(name).parents('tr').find('td:nth-child(1) input').click()

  checkAttendanceStatus = (name, status) =>
    cy
      .get('#attendanceList')
      .find('td:nth-child(2)')
      .contains(name)
      .parents('tr')
      .find('td:nth-child(5)')
      .contains(status)

  markAsAttended = () => cy.get('button').contains('Mark as attended').click()
}
