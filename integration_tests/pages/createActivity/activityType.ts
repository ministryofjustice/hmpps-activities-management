import Page from '../page'

export default class ActivityTypePage extends Page {
  constructor() {
    super('activity-type-page')
  }

  heading = () => cy.get('h1')

  insideOption = () => cy.get('label[for="type"]')

  outsideOption = () => cy.get('label[for="type-2"]')

  outsideHint = () => cy.get('#type-2-item-hint')

  selectInside = () => this.getInputById('type').click()

  selectOutside = () => this.getInputById('type-2').click()
}
