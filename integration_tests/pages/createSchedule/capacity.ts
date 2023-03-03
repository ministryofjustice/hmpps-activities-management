import Page from '../page'

export default class CapacityPage extends Page {
  constructor() {
    super('create-schedule-capacity-page')
  }

  enterCapacity = (capacity: string) => this.getInputById('capacity').clear().type(capacity)
}
