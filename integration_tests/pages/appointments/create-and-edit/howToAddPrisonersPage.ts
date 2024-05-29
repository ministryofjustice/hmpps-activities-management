import Page from '../../page'

export default class HowToAddPrisonersPage extends Page {
  constructor() {
    super('appointments-create-how-to-add-prisoners-page')
  }

  selectOneByOne = () => this.getInputByLabel('Search for them one by one').click()

  selectGroup = () => this.getInputByLabel('Add a group of people using a CSV file').click()

  assertHowToAdd = (option: string) => cy.get(`[name='howToAdd']:checked`).next().should('contain.text', option)
}
