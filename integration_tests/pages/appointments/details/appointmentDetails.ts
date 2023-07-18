import Page from '../../page'
import { formatDate } from '../../../../server/utils/utils'

export default class AppointmentDetailsPage extends Page {
  constructor() {
    super('appointments-view-details-page')
  }

  viewEditOccurrenceLink = (sequenceNumber: number) =>
    cy.get(`[data-qa=view-and-edit-occurrence-${sequenceNumber}]`).contains('Manage details')

  printMovementSlipLink = () => cy.get('[data-qa=print-movement-slip-link]')

  assertAppointmentSeriesDetail = (header: string, value: string) =>
    this.assertSummaryListValue('appointment-series-details', header, value)

  assertAppointmentDetail = (header: string, value: string) =>
    this.assertSummaryListValue('appointment-details', header, value)

  assertAppointmentOccurrenceSummary = (sequenceNumber: string, column: string, value: string) =>
    cy
      .get(`[data-qa=occurrence-sequence-no-${sequenceNumber}]`)
      .siblings(`[data-qa=occurrence-${column}-${sequenceNumber}]`)
      .contains(value)

  assertPrisonerSummary = (name: string, number: string, cellLocation: string) => {
    cy.get('[data-qa=prisoner-name]')
      .contains(name)
      .parents('[data-qa=prisoner-summary]')
      .find('[data-qa=prisoner-number]')
      .contains(number)
      .parents('[data-qa=prisoner-summary]')
      .find('[data-qa=prisoner-cell-location]')
      .contains(cellLocation)
  }

  assertPrisonerCount = (category: string) => this.assertAppointmentDetail('Prisoners', category)

  assertCategory = (category: string) => this.assertAppointmentDetail('Type', category)

  assertLocation = (location: string) => this.assertAppointmentDetail('Location', location)

  assertStartDate = (startDate: Date) =>
    this.assertAppointmentDetail('Date', formatDate(startDate, 'EEEE, d MMMM yyyy'))

  assertStartTime = (hour: number, minute: number) =>
    this.assertAppointmentDetail('Start time', `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)

  assertEndTime = (hour: number, minute: number) =>
    this.assertAppointmentDetail('End time', `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)

  assertAppointmentSeriesDetails = () => cy.get('[data-qa=appointment-series-details]').should('exist')

  assertRepeatPeriod = (option: string) => this.assertAppointmentSeriesDetail('Frequency', option)

  assertRepeatCount = (option: string) => this.assertAppointmentSeriesDetail('Number of appointments', option)

  assertOccurrences = (occurrenceMap: Map<number, string>) => {
    occurrenceMap.forEach((date, sequenceNumber) => {
      this.assertAppointmentOccurrenceSummary(sequenceNumber.toString(), 'date', date)
    })
  }

  assertCreatedBy = (createdBy: string) => this.assertAppointmentSeriesDetail('Created by', createdBy)

  assertPrintMovementSlipLink = () => this.printMovementSlipLink().contains('Print movement slip')
}
