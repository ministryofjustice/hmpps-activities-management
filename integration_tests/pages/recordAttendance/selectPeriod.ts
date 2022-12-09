import Page from '../page'

export default class SelectPeriodPage extends Page {
  constructor() {
    super('select-period-page')
  }

  enterDate = (date: string) => {
    cy.get('#datePresetOption-3').click()
    cy.get('#date-day').type(date.split('-')[2])
    cy.get('#date-month').type(date.split('-')[1])
    cy.get('#date-year').type(date.split('-')[0])
  }

  selectTimePeriod = (text: string) => this.getInputByLabel(text).click()

  submit = () => cy.get('button').contains('Submit').click()
}
