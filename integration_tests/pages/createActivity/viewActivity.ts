import Page from '../page'

export default class ViewActivityPage extends Page {
  constructor() {
    super('view-activity-page')
  }

  changePayLink = () => cy.get('[data-qa="change-pay-link"]')
}
