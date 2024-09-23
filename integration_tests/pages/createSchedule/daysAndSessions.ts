import Page from '../page'

export default class DaysAndSessionsPage extends Page {
  constructor() {
    super('create-schedule-days-and-times-page')
  }

  title = () => cy.get('h1')

  checkboxes = () => cy.get('[data-qa="day-session-checkboxes"]')

  selectDayTimeCheckboxes = (checkboxes: [string, string[]][]) =>
    checkboxes.forEach(dayCheckbox => {
      const input = this.getInputByLabel(dayCheckbox[0]).click()

      if (!dayCheckbox[1]) return

      input
        .invoke('attr', 'aria-controls')
        .then(conditionalContainerId => cy.get(`#${conditionalContainerId}`).as('conditionalContainer'))
      dayCheckbox[1].forEach(timeCheckbox => cy.get('@conditionalContainer').contains('label', timeCheckbox).click())
    })

  uncheckAllCheckboxes = () => cy.get('[type="checkbox"]').uncheck({ force: true })

  updateButton = () => cy.get('button').contains('Update days and sessions').click()
}
