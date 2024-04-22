import Page from '../../page'

export default class SelectPeriodPage extends Page {
  constructor() {
    super('activities-page')
  }

  selectToday = () => cy.get('[value=today]').click()
}
