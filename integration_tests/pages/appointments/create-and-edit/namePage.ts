import Page from '../../page'

export default class NamePage extends Page {
  constructor() {
    super('appointments-create-name-page')
  }

  selectCategory = (category: string) => this.getInputById('categoryCode').clear().type(category)

  assertSelectedCategory = (category: string) => this.getInputById('categoryCode').should('have.value', category)
}
