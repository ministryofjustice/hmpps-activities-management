import Page from '../../page'

export default class RepeatFrequencyAndCountPage extends Page {
  constructor() {
    super('appointment-repeat-frequency-and-count-page')
  }

  selectFrequency = (option: string) => this.getInputByLabel(option).click()

  assertFrequency = (option: string) => cy.get(`[name='frequency']:checked`).next().should('contain.text', option)

  enterNumberOfAppointments = (count: string) => this.getInputByName('numberOfAppointments').clear().type(count)

  assertNumberOfAppointments = (count: string) =>
    this.getInputByName('numberOfAppointments').should('have.value', count)

  assertEndDate = (dateString: string) => cy.get('[data-qa=end-date]').should('contain.text', dateString)
}
