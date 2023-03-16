import Page from '../../page'
import { formatDate } from '../../../../server/utils/utils'

export default class AppointmentDetailsPage extends Page {
  constructor() {
    super('appointments-view-details-page')
  }

  viewEditOccurrenceLink = (sequenceNumber: number) =>
    cy.get(`[data-qa=view-and-edit-occurrence-${sequenceNumber}]`).contains('View and edit')

  printMovementSlipLink = () => cy.get('[data-qa=print-movement-slip-link]')

  assertAppointmentDetail = (header: string, value: string) =>
    this.assertSummaryListValue('appointment-details', header, value)

  assertAppointmentOccurrence = (header: string, value: string) =>
    this.assertSummaryListValue('appointment-occurrences', header, value)

  assertPrisonerSummary = (name: string, number: string, cellLocation: string) => {
    cy.get('[data-qa=prisoner-name]').contains(name)
    cy.get('[data-qa=prisoner-number]').contains(number)
    cy.get('[data-qa=prisoner-cell-location]').contains(cellLocation)
  }

  assertCategory = (category: string) => this.assertAppointmentDetail('Category', category)

  assertLocation = (location: string) => this.assertAppointmentDetail('Location', location)

  assertStartDate = (startDate: Date) => this.assertAppointmentDetail('Date', formatDate(startDate, 'EEEE d MMMM yyyy'))

  assertStartTime = (hour: number, minute: number) =>
    this.assertAppointmentDetail('Start time', `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)

  assertEndTime = (hour: number, minute: number) =>
    this.assertAppointmentDetail('End time', `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)

  assertRepeat = (option: string) => this.assertAppointmentDetail('Repeat', option)

  assertRepeatPeriod = (option: string) => this.assertAppointmentDetail('Frequency', option)

  assertRepeatCount = (option: string) => this.assertAppointmentDetail('Occurrences', option)

  assertOccurrences = (occurrenceMap: Map<number, string>) =>
    occurrenceMap.forEach((date, sequenceNumber) => this.assertAppointmentOccurrence(sequenceNumber.toString(), date))

  assertCreatedBy = (createdBy: string) => this.assertSummaryListValue('user-details', 'Created by', createdBy)

  assertPrintMovementSlipLink = () => this.printMovementSlipLink().contains('Print movement slip')
}
