import Page from '../page'

export default class NotAttendedReasonPage extends Page {
  constructor() {
    super('not-attended-reason-page')
  }

  selectRadio = (name: string) => this.getInputByName(name).eq(0).click()

  submit = () => cy.get('button').contains('Confirm and record attendance').click()
}
