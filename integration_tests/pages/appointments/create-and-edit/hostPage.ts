import Page from '../../page'

export default class HostPage extends Page {
  constructor() {
    super('appointment-host-page')
  }

  selectHost = (host: string) => this.getInputByLabel(host).click()

  assertHost = (host: string) => cy.get(`[name='host']:checked`).next().should('contain.text', host)
}
