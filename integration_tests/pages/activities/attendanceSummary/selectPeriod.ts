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

  pickDateFromToday = (days: number) => {
    const target = new Date()
    target.setDate(target.getDate() + days)
    const targetDay = target.getDate().toString()

    cy.get('.moj-datepicker__calendar').should('be.visible')
    cy.get('.moj-datepicker__calendar button')
      .contains(new RegExp(`^${targetDay}$`))
      .click()

    cy.get('.moj-datepicker__dialog').should('not.be.visible')
  }
}
