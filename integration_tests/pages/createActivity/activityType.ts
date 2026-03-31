import Page from '../page'

export default class ActivityTypePage extends Page {
  constructor() {
    super('activity-type-page')
  }

  selectInsideType = () => this.getInputById('type').click()

  selectOutsideType = () => this.getInputById('type-2').click()
}
