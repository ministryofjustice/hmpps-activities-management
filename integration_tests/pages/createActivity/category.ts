import Page from '../page'

export default class CategoryPage extends Page {
  constructor() {
    super('category-page')
  }

  selectCategory = (text: string) => this.getInputByLabel(text).click()
}
