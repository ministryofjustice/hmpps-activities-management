import { getDate, getMonth, getYear, parse } from 'date-fns'
import Page from '../../page'

export default class SelectPeriodPage extends Page {
  constructor() {
    super('select-period-page')
  }

  selectADifferentDate = () => {
    this.getInputByLabel('A different date').click()
    cy.log('Clicked "A different date" to show the date input.')

    // Open the datepicker
    cy.get('.moj-datepicker__toggle').click()
    cy.log('Opened the datepicker.')
  }

  pickDateFromToday = (date: Date) => {
    // Select month and year
    const month = getMonth(date)
    const year = getYear(date)
    cy.get('.moj-datepicker__dialog-title').then($datePickerTitle => {
      const datePickerTitle = $datePickerTitle.text().trim()

      const selectedYear = +datePickerTitle.split(' ')[1]
      const yearDelta = Math.abs(selectedYear - year)
      for (let i = 0; i < yearDelta; i += 1) {
        cy.get(`.moj-js-datepicker-${year > selectedYear ? 'next' : 'prev'}-year`).click()
      }

      const selectedMonth = getMonth(parse(datePickerTitle.split(' ')[0], 'MMMM', new Date()))
      const monthDelta = Math.abs(selectedMonth - month)
      for (let i = 0; i < monthDelta; i += 1) {
        cy.get(`.moj-js-datepicker-${month > selectedMonth ? 'next' : 'prev'}-month`).click()
      }
    })

    cy.checkA11y(null, null, this.terminalLog)

    // Select day
    cy.get('.moj-datepicker__calendar')
      .find('button:visible')
      .contains(new RegExp(`^${getDate(date).toString()}$`))
      .click()

    cy.get('.moj-datepicker__dialog').should('not.be.visible')
  }
}
