import Page from '../../page'

export default class CategoryPage extends Page {
  constructor() {
    super('appointments-create-single-category-page')
  }

  selectCategory = (category: string) => this.getInputById('categoryId').type(category)

  assertSelectedCategory = (category: string) => this.getInputById('categoryId').should('have.value', category)
}
