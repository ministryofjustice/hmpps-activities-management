import Page from '../../page'

export default class PendingApplicationsPage extends Page {
  constructor() {
    super('Pending-application')
  }

  selectRadioByLabel(labelText: string) {
    cy.contains('.govuk-radios__item', labelText).find('input[type="radio"]').check()
  }
}
