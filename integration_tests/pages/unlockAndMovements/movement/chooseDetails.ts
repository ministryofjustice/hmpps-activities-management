import Page from '../../page'

export default class ChooseDetailsPage extends Page {
  constructor() {
    super('movement-list-choose-details-page')
  }

  selectToday = () => cy.get('[value=today]').click()

  selectAM = () => cy.get('[value=AM]').click()
}
