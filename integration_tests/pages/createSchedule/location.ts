import Page from '../page'

export default class LocationPage extends Page {
  constructor() {
    super('create-schedule-location-page')
  }

  selectSearchForLocation = () => this.getInputByLabel('Search for a location').click()

  selectLocation = (location: string) => this.getInputById('location').clear().type(location)
}
