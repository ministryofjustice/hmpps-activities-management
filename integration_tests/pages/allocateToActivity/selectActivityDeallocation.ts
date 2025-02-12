import Page from '../page'

export default class SelectActivitiesPage extends Page {
  constructor() {
    super('deallocate-after-allocation-select-activity-page')
  }

  selectCheckbox = (option: string) => this.getInputByName('selectedAllocations').check(option)
}
