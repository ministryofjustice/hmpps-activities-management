import Page from '../../page'

export default class LocationPage extends Page {
  constructor() {
    super('appointment-location-page')
  }

  selectSearchForLocation = () => this.getInputByLabel('Search for a location').click()

  selectInCell = () => this.getInputByLabel('In cell').click()

  selectLocation = (location: string) => this.getInputById('locationId').clear().type(location)

  assertSelectedLocation = (location: string) => this.getInputById('locationId').should('have.value', location)
}
