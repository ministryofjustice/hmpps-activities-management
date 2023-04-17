import Page from '../../page'

export default class CategoryPage extends Page {
  constructor() {
    super('appointments-create-category-page')
  }

  selectCategory = (category: string) => this.getInputById('categoryCode').clear().type(category)

  assertSelectedCategory = (category: string) => this.getInputById('categoryCode').should('have.value', category)
}
