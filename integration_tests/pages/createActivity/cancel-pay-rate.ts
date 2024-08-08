import Page from '../page'

export default class CancelPayRatePage extends Page {
  constructor() {
    super('cancel-pay-rate-page')
  }

  cancelPayRate = () => cy.get('#cancelOption').check()
}
