import Page from '../../page'

export default class SelectDatePage extends Page {
  constructor() {
    super('appointment-attendance-select-date-page')
  }

  enterDate = (date: Date) => {
    cy.get('[value=other]').click()
    this.selectDatePickerDate(date)
  }
}
