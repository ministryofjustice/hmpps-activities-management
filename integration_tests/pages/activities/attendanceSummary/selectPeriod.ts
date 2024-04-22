import Page from '../../page'

export default class SelectPeriodPage extends Page {
  constructor() {
    super('select-period-page')
  }

  selectToday = () => cy.get('[value=today]').click()
}
