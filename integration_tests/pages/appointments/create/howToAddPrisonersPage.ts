import Page from '../../page'

export default class HowToAddPrisonersPage extends Page {
  constructor() {
    super('appointments-create-how-to-add-prisoners-page')
  }

  selectHowToAdd = (option: string) => this.getInputByLabel(option).click()

  assertHowToAdd = (option: string) => cy.get(`[name='howToAdd']:checked`).next().should('contain.text', option)
}
