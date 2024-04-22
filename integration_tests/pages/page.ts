import path from 'path'
import { format, getDate, getMonth, getYear, parse } from 'date-fns'
import * as axe from 'axe-core'
import DatePicker from '../components/datePicker'
import SummaryList from '../components/summaryList'
import { formatDatePickerDate } from '../../server/utils/datePickerUtils'

export default abstract class Page {
  static verifyOnPage<T>(constructor: new () => T): T {
    return new constructor()
  }

  protected constructor(
    private readonly pageId: string,
    private readonly pauseAxeOnThisPage = false,
  ) {
    this.checkOnPage()

    if (!pauseAxeOnThisPage) {
      cy.injectAxe()
      cy.configureAxe({
        // These disabled rules suppress only common upstream GOVUK Design System behaviours:
        rules: [
          // aria-allowed-attr is disabled because radio buttons can have aria-expanded which isn't
          // currently allowed by the spec, but that might change: https://github.com/w3c/aria/issues/1404
          { id: 'aria-allowed-attr', enabled: false },
          { id: 'color-contrast', enabled: false },
        ],
      })
      cy.checkA11y(null, null, this.terminalLog)
    }
  }

  checkOnPage = (): void => {
    cy.get(`#${this.pageId}`).should('exist')
  }

  signOut = (): Cypress.Chainable => cy.get('[data-qa=signOut]')

  manageDetails = (): Cypress.Chainable => cy.get('[data-qa=manageDetails]')

  headerUserName = (): Cypress.Chainable => cy.get('[data-qa=header-user-name]')

  headerActiveCaseload = (): Cypress.Chainable => cy.get('[data-qa=header-active-caseload]')

  headerChangeLocation = (): Cypress.Chainable => cy.get('[data-qa=header-change-location]')

  getInputByLabel = (label: string): Cypress.Chainable =>
    cy
      .contains('label', label)
      .invoke('attr', 'for')
      .then(id => {
        cy.get(`#${id}`)
      })

  getButton = (value: string): Cypress.Chainable => cy.get(`button:contains(${value})`)

  getInputById = (id: string): Cypress.Chainable => cy.get(`[id=${id}]`)

  getInputByName = (name: string): Cypress.Chainable => cy.get(`[name="${name}"]`)

  getLinkByText = text => cy.get('a').contains(text)

  continue = () => cy.get('button').contains('Continue').click()

  confirm = () => cy.get('button').contains('Confirm').click()

  saveAndContinue = () => cy.get('button').contains('Save and continue').click()

  back = () => cy.get('.govuk-back-link').contains('Back').click()

  assertNoBackLink = () => cy.get('.govuk-back-link').should('not.exist')

  assertSummaryListValue = (listIdentifier: string, heading: string, expectedValue: string) =>
    cy
      .get(`[data-qa=${listIdentifier}] > .govuk-summary-list__row > .govuk-summary-list__key`)
      .contains(heading)
      .parent()
      .find('.govuk-summary-list__value')
      .should('contain.text', expectedValue)

  protected getDatePickerById = (id: string) => new DatePicker(id)

  protected getSummaryListById = (id: string) => new SummaryList(id)

  assertNotificationContents = (titleText, notificationText = null) => {
    cy.get('.govuk-notification-banner .govuk-notification-banner__heading').contains(titleText)

    if (notificationText) {
      cy.get('.govuk-notification-banner .govuk-notification-banner__content').contains(notificationText)
    }
  }

  assertValidationError = (forName, errorText) => {
    cy.get(`.govuk-error-summary__list a[href="#${forName}"]`).contains(errorText)
  }

  assertFileDownload = (filename: string) => {
    const downloadsFolder = Cypress.config('downloadsFolder')
    const downloadPath = path.join(downloadsFolder, filename)

    cy.readFile(downloadPath).should('exist')
  }

  datePickerDialog = (): Cypress.Chainable => cy.get('.hmpps-datepicker__dialog')

  openDatePicker = () => {
    this.datePickerDialog().should('not.be.visible')
    cy.get('.hmpps-datepicker-button').click()
    this.datePickerDialog().should('be.visible')
    cy.checkA11y(null, null, this.terminalLog)
  }

  closeDatePicker = () => {
    this.datePickerDialog().find(`button:contains('Cancel')`).click()
    this.datePickerDialog().should('not.be.visible')
    cy.checkA11y(null, null, this.terminalLog)
  }

  selectDatePickerDate = (date: Date) => {
    this.openDatePicker()

    // Select month and year
    const month = getMonth(date)
    const year = getYear(date)
    cy.get('.hmpps-datepicker__dialog__title').then($datePickerTitle => {
      const datePickerTitle = $datePickerTitle.text().trim()

      const selectedYear = +datePickerTitle.split(' ')[1]
      const yearDelta = Math.abs(selectedYear - year)
      for (let i = 0; i < yearDelta; i += 1) {
        cy.get(`.js-datepicker-${year > selectedYear ? 'next' : 'prev'}-year`).click()
      }

      const selectedMonth = getMonth(parse(datePickerTitle.split(' ')[0], 'MMMM', new Date()))
      const monthDelta = Math.abs(selectedMonth - month)
      for (let i = 0; i < monthDelta; i += 1) {
        cy.get(`.js-datepicker-${month > selectedMonth ? 'next' : 'prev'}-month`).click()
      }
    })

    cy.checkA11y(null, null, this.terminalLog)

    // Select day
    cy.get('.hmpps-datepicker__dialog__table')
      .find('button')
      .filter(':visible')
      .contains(new RegExp(`^${getDate(date).toString()}$`))
      .click()

    this.datePickerDialog().should('not.be.visible')
  }

  assertDatePickerDate = (date: Date) => {
    cy.get('.hmpps-js-datepicker-input').should('have.value', formatDatePickerDate(date))
    this.openDatePicker()
    // Verify month and year are displayed
    cy.get('.hmpps-datepicker__dialog__title').should('contain.text', format(date, 'MMMM yyyy'))
    // Verify day is selected
    cy.get('.hmpps-datepicker__dialog__table')
      .find('button')
      .filter(':visible')
      .contains(new RegExp(`^${getDate(date).toString()}$`))
      .should('have.class', 'hmpps-datepicker-selected')
    this.closeDatePicker()
  }

  terminalLog(violations: axe.Result[]) {
    const violationData = violations.map(({ id, impact, help, helpUrl, nodes }) => ({
      id,
      impact,
      help,
      helpUrl,
      nodes: nodes.length,
    }))

    if (violationData.length > 0) {
      cy.task('log', 'Violation summary')
      cy.task('table', violationData)

      cy.task('log', 'Violation detail')
      cy.task('log', '----------------')

      violations.forEach(v => {
        v.nodes.forEach(node => {
          cy.task('log', node.failureSummary)
          cy.task('log', `Impact: ${node.impact}`)
          cy.task('log', `Target: ${node.target}`)
          cy.task('log', `HTML: ${node.html}`)
          cy.task('log', '----------------')
        })
      })
    }
  }
}
