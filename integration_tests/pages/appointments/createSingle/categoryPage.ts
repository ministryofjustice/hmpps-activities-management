import Page from '../../page'

export default class CategoryPage extends Page {
  constructor() {
    super('appointments-create-single-category-page')
  }

  selectCategory = (text: string) => this.getInputById('categoryId').type(text)
}
