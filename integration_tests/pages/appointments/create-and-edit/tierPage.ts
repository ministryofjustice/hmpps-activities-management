import Page from '../../page'

export default class TierPage extends Page {
  constructor() {
    super('appointment-tier-page')
  }

  selectTier = (tier: string) => this.getInputByLabel(tier).click()

  assertTier = (tier: string) => cy.get(`[name='tier']:checked`).next().should('contain.text', tier)
}
