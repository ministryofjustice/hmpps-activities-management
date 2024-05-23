import Page from '../../page'

export default class CopySeriesPage extends Page {
  constructor() {
    super('appointments-copy-series-page')
  }

  oneOffAppointment = (): Cypress.Chainable => this.getInputByLabel('A one-off appointment')

  seriesAppointment = (): Cypress.Chainable => this.getInputByLabel('A series of repeating appointments')
}
