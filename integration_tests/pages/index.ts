import Page, { PageElement } from './page'

export default class IndexPage extends Page {
  constructor() {
    super('index-page')
  }

  allocateToActivityCard = (): PageElement => cy.get('[data-qa=allocate-to-activities-card]')
}
