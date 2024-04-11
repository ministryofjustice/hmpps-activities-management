import Page from '../../page'

export default class ChooseDateAndLocationPage extends Page {
  constructor() {
    super('select-date-and-location-page')
  }

  selectToday = () => cy.get('[value=today]').click()

  selectAM = () => cy.get('[value=am]').click()

  selectLocation = (location: string) => cy.get(`[value="${location}"]`).click()
}
