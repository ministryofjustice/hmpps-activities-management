import Page from '../page'

export default class ActivityTierPage extends Page {
  constructor() {
    super('tier-page')
  }

  selectActivityTier = (tier: string) => this.getInputByLabel(tier).click()
}
