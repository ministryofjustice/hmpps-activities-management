import Page from '../page'

export default class AttendanceListPage extends Page {
  constructor() {
    super('attendance-list-page')
  }

  markAsAttended = () => cy.get('button').contains('Mark as attended').click()

  markAsNotAttended = () => cy.get('button').contains('Mark as not attended').click()

  assertRow(rowNum, checkbox, name, location, activity, session, attendanceAndPay, viewLink = '') {
    cy.get(`[data-module=activities-sticky-select] tr`)
      .eq(rowNum + 1)
      .find('td')
      .eq(1)
      .contains(name)
      .parents('tr')
      .find('td')
      .eq(2)
      .contains(location)
      .parents('tr')
      .find('td')
      .eq(3)
      .contains(activity)
      .parents('tr')
      .find('td')
      .eq(4)
      .contains(session)
      .parents('tr')
      .find('td')
      .eq(6)
      .contains(attendanceAndPay)
      .parents('tr')
      .find('td')
      .eq(7)
      .then($link => {
        if (viewLink) {
          cy.wrap($link).contains(viewLink)
        } else {
          cy.wrap($link).should($el => {
            expect($el.text().trim()).equal('')
          })
        }
      })
      .parents('tr')
      .find('td')
      .eq(0)
      .find('input[type=checkbox]')
      .should(checkbox ? 'exist' : 'not.exist')
  }

  clickRow = rowNum => {
    cy.get(`[data-module=activities-sticky-select] tr`)
      .eq(rowNum)
      .find('td')
      .eq(0)
      .find('input[type=checkbox]')
      .click({ force: true })
  }

  clickRows = (...rownNums: number[]) => rownNums.forEach(rowNum => this.clickRow(rowNum))
}
