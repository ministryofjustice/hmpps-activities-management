import Page from '../../../page'

export default class PrisonLocationsPage extends Page {
  constructor() {
    super('location-page')
  }

  selectLocation = (location: string) => this.getInputById('location').clear().type(location)
}
