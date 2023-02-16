import Page from '../../page'

export default class LocationPage extends Page {
  constructor() {
    super('appointments-create-single-location-page')
  }

  selectLocation = (text: string) => this.getInputById('locationId').type(text)
}
