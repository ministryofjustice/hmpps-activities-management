import Page from '../page'

export default class LocationPage extends Page {
  constructor() {
    super('create-schedule-location-page')
  }

  selectOutOfCell = () => this.getInputByLabel('Out of cell').click()

  selectLocation = (location: string) => this.getInputById('location').clear().type(location)
}
