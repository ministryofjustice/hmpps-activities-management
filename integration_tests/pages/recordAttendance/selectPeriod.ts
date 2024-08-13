import Page from '../page'

export default class SelectPeriodPage extends Page {
  constructor() {
    super('select-period-page')
  }

  enterDate = (date: Date) => {
    cy.get('#datePresetOption-3').click()
    this.selectDatePickerDate(date)
  }

  selectAM = () => cy.get('[value=AM]').click()

  selectPM = () => cy.get('[value=PM]').click()

  selectED = () => cy.get('[value=ED]').click()
}
