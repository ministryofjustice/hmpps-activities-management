import Page from '../../page'

export default class LocationsPage extends Page {
  constructor() {
    super('movement-list-locations-page')
  }

  selectLocation = (location: string) => cy.contains(location).siblings().find('a')
}
