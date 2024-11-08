import { format } from 'date-fns'
import Page from '../../page'

export default class AppointmentDetailsPage extends Page {
  constructor() {
    super('appointment-details-page')
  }

  printMovementSlipLink = () => cy.get('[data-qa=print-movement-slips]')

  addPrisonersLink = () => cy.get('[data-qa=add-prisoners]')

  assertSeriesDetail = (header: string, value: string) =>
    this.assertSummaryListValue('appointment-series-details', header, value)

  assertAppointmentDetail = (header: string, value: string) =>
    this.assertSummaryListValue('appointment-details', header, value)

  assertAppointmentHistory = (header: string, value: string) =>
    this.assertSummaryListValue('appointment-history', header, value)

  assertPrisonerSummary = (name: string, number: string, cellLocation: string) => {
    cy.get('[data-qa=prisoner-name]')
      .contains(name)
      .parents('[data-qa=prisoner-summary]')
      .find('[data-qa=prisoner-number]')
      .contains(number)
      .parents('[class=govuk-table__row]')
      .find('[data-qa=prisoner-cell-location]')
      .contains(cellLocation)
  }

  assertName = (category: string) => this.assertAppointmentDetail('Appointment name', category)

  assertLocation = (location: string) => this.assertAppointmentDetail('Location', location)

  assertStartDate = (startDate: Date) => this.assertAppointmentDetail('Date', format(startDate, 'EEEE, d MMMM yyyy'))

  assertStartTime = (hour: number, minute: number) =>
    this.assertAppointmentDetail('Start time', `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)

  assertEndTime = (hour: number, minute: number) =>
    this.assertAppointmentDetail('End time', `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)

  assertAppointmentSeriesDetails = () => cy.get('[data-qa=appointment-series-details]').should('exist')

  assertNoAppointmentSeriesDetails = () => cy.get('[data-qa=appointment-series-details]').should('not.exist')

  assertViewSeriesLink = () => this.viewSeriesLink().contains('View series')

  viewSeriesLink = () => cy.get('[data-qa=view-series]')

  assertCreatedBy = (createdBy: string) => this.assertAppointmentHistory('Created by', createdBy)

  assertPrintMovementSlipLink = () => this.printMovementSlipLink().contains('Print movement slip')

  getChangeLink = (property: string) =>
    cy
      .get('[data-qa=appointment-details]')
      .find(`.govuk-summary-list__key:contains(${property})`)
      .parent()
      .find(`.govuk-summary-list__actions a:contains(Change)`)

  copyAppointmentLink = (): Cypress.Chainable => cy.get('[data-qa=copy-appointment]')

  assertSeriesFrequency = (frequency: string) => this.assertSeriesDetail('Frequency', frequency)

  assertSeriesSequence = (sequence: string) => this.assertSeriesDetail('Appointment', sequence)
}
