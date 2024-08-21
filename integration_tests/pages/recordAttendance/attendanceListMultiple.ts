import Page from '../page'

export default class AttendanceListPage extends Page {
  constructor() {
    super('attendance-list-page')
  }

  markAsAttended = () => cy.get('button').contains('Mark as attended').click()

  markAsNotAttended = () => cy.get('button').contains('Mark as not attended').click()

  assertRow(rowNum, checkbox, name, location, activity, time, attendanceAndPay, viewLink = '') {
    cy.get('[data-module=activities-sticky-select] tr')
      .eq(rowNum + 1)
      .find('td')
      .then($data => {
        cy.wrap($data.get(0))
          .find('input[type=checkbox]')
          .should(checkbox ? 'exist' : 'not.exist')
        expect($data.get(1).innerText).to.contain(name)
        expect($data.get(2).innerText).to.contain(location)
        expect($data.get(3).innerText).to.contain(activity)
        expect($data.get(4).innerText).to.contain(time)
        expect($data.get(6).innerText).to.contain(attendanceAndPay)
        if (viewLink) {
          cy.wrap($data.get(7)).contains(viewLink)
        } else {
          cy.wrap($data.get(7)).should($el => {
            expect($el.text().trim()).equal('')
          })
        }
      })
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
