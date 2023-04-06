import Page from '../../page'
import { formatDate } from '../../../../server/utils/utils'

export default class OccurrenceDetailsPage extends Page {
  constructor() {
    super('appointment-occurrence-view-details-page')
  }

  printMovementSlipLink = () => cy.get('[data-qa=print-movement-slip-link]')

  assertAppointmentDetail = (header: string, value: string) =>
    this.assertSummaryListValue('appointment-details', header, value)

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

  assertCategory = (category: string) => this.assertAppointmentDetail('Category', category)

  assertLocation = (location: string) => this.assertAppointmentDetail('Location', location)

  assertStartDate = (startDate: Date) => this.assertAppointmentDetail('Date', formatDate(startDate, 'EEEE d MMMM yyyy'))

  assertStartTime = (hour: number, minute: number) =>
    this.assertAppointmentDetail('Start time', `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)

  assertEndTime = (hour: number, minute: number) =>
    this.assertAppointmentDetail('End time', `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)

  assertCreatedBy = (createdBy: string) => this.assertSummaryListValue('user-details', 'Created by', createdBy)

  assertPrintMovementSlipLink = () => this.printMovementSlipLink().contains('Print movement slip')
}
