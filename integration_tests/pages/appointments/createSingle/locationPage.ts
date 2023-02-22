import Page from '../../page'

export default class LocationPage extends Page {
  constructor() {
    super('appointments-create-single-location-page')
  }

  selectLocation = (location: string) => this.getInputById('locationId').clear().type(location)

  assertSelectedLocation = (location: string) => this.getInputById('locationId').should('have.value', location)
}
