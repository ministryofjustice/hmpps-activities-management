import Page from '../page'

export default class DaysAndTimesPage extends Page {
  constructor() {
    super('create-schedule-days-and-times-page')
  }

  selectDayTimeCheckboxes = (checkboxes: [string, string[]][]) =>
    checkboxes.forEach(dayCheckbox => {
      const input = this.getInputByLabel(dayCheckbox[0]).click()

      if (!dayCheckbox[1]) return

      input
        .invoke('attr', 'aria-controls')
        .then(conditionalContainerId => cy.get(`#${conditionalContainerId}`).as('conditionalContainer'))
      dayCheckbox[1].forEach(timeCheckbox => cy.get('@conditionalContainer').contains('label', timeCheckbox).click())
    })
}
