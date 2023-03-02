import { getDate, getMonth, getYear } from 'date-fns'

export default class DatePicker {
  readonly componentId: string

  constructor(componentId: string) {
    this.componentId = componentId
  }

  component = (): Cypress.Chainable => cy.get(`#${this.componentId}`)

  enterDate = (date: Date) => {
    this.component().find(`#${this.componentId}-day`).clear().type(getDate(date).toString())
    this.component()
      .find(`#${this.componentId}-month`)
      .clear()
      .type((getMonth(date) + 1).toString())
    this.component().find(`#${this.componentId}-year`).clear().type(getYear(date).toString())
  }
}
