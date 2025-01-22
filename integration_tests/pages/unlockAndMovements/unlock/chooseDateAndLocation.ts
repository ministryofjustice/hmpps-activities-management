import Page from '../../page'

export default class ChooseDateAndLocationPage extends Page {
  constructor() {
    super('select-date-and-location-page')
  }

  selectLocation = (location: string) => cy.get(`[value="${location}"]`).click()
}
