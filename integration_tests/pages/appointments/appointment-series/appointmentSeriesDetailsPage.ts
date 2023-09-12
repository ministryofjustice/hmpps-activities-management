import Page from '../../page'
import { formatDate } from '../../../../server/utils/utils'

export default class AppointmentDetailsPage extends Page {
  constructor() {
    super('appointment-series-details-page')
  }

  manageAppointmentLink = (sequenceNumber: number) =>
    cy.get(`[data-qa=view-and-edit-appointment-${sequenceNumber}]`).contains('Manage details')

  assertAppointmentSeriesDetail = (header: string, value: string) =>
    this.assertSummaryListValue('appointment-series-details', header, value)

  assertAppointmentDetail = (header: string, value: string) =>
    this.assertSummaryListValue('appointment-details', header, value)

  assertAppointmentSummary = (sequenceNumber: string, column: string, value: string) =>
    cy
      .get(`[data-qa=appointment-sequence-no-${sequenceNumber}]`)
      .siblings(`[data-qa=appointment-${column}-${sequenceNumber}]`)
      .contains(value)

  assertStartDate = (startDate: Date) =>
    this.assertAppointmentDetail('Date', formatDate(startDate, 'EEEE, d MMMM yyyy'))

  assertStartTime = (hour: number, minute: number) =>
    this.assertAppointmentDetail('Start time', `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)

  assertEndTime = (hour: number, minute: number) =>
    this.assertAppointmentDetail('End time', `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)

  assertAppointmentSeriesDetails = () => cy.get('[data-qa=appointment-series-details]').should('exist')

  assertFrequency = (option: string) => this.assertAppointmentSeriesDetail('Frequency', option)

  assertNumberOfAppointments = (option: string) => this.assertAppointmentSeriesDetail('Number of appointments', option)

  assertAppointments = (appointmentMap: Map<number, string>) => {
    appointmentMap.forEach((date, sequenceNumber) => {
      this.assertAppointmentSummary(sequenceNumber.toString(), 'date', date)
    })
  }

  assertCreatedBy = (createdBy: string) => this.assertAppointmentSeriesDetail('Created by', createdBy)
}
