import { JourneyData } from '../../../../server/@types/express'
import {
  AppointmentJourneyMode,
  AppointmentType,
} from '../../../../server/routes/appointments/create-and-edit/appointmentJourney'
import { AppointmentFrequency, AppointmentCancellationReason } from '../../../../server/@types/appointments'
import { YesNo } from '../../../../server/@types/activities'
import EventTier from '../../../../server/enum/eventTiers'
import EventOrganiser from '../../../../server/enum/eventOrganisers'
import stubCreateAppointmentScenario from '../../helpers/appointments/createAppointment'
import stubManageAppointmentScenario from '../../helpers/appointments/manageAppointment'
import { stubEndpoint } from '../../../../integration_tests/mockApis/wiremock'
import appointmentDetails from '../../../../integration_tests/fixtures/activitiesApi/getAppointmentDetails.json'

const prisoner = {
  number: 'A8644DY',
  name: 'Stephen Gregs',
  firstName: 'Stephen',
  lastName: 'Gregs',
  prisonCode: 'MDI',
  status: 'ACTIVE IN',
  cellLocation: '1-1-1',
}
export const appointmentJourney: JourneyData = {
  appointmentJourney: {
    mode: AppointmentJourneyMode.CREATE,
    type: AppointmentType.GROUP,
    appointmentName: 'Chaplaincy',
    prisoners: [prisoner],
    category: { code: 'CHAP', description: 'Chaplaincy' },
    tierCode: EventTier.TIER_2,
    organiserCode: EventOrganiser.PRISON_STAFF,
    location: { id: 'aaa', description: 'Chapel' },
    inCell: false,
    startDate: '2030-01-02',
    startTime: { hour: 14, minute: 0, date: new Date('2030-01-02T14:00:00Z') },
    endTime: { hour: 15, minute: 0, date: new Date('2030-01-02T15:00:00Z') },
    repeat: YesNo.YES,
    frequency: AppointmentFrequency.DAILY,
    numberOfAppointments: 2,
    originalAppointmentId: 11,
    extraInformation: 'Smoke appointment',
    createJourneyComplete: true,
  },
  appointmentSetJourney: {
    appointments: [{ prisoner, startTime: { hour: 14, minute: 0 }, endTime: { hour: 15, minute: 0 } }],
  },
  editAppointmentJourney: {
    numberOfAppointments: 2,
    sequenceNumber: 1,
    property: 'cancel',
    appointments: [
      { sequenceNumber: 1, startDate: '2030-01-02', cancelled: false },
      { sequenceNumber: 2, startDate: '2030-01-03', cancelled: false },
    ],
    cancellationReason: AppointmentCancellationReason.CANCELLED,
    addPrisoners: [prisoner],
  },
}
export const stubAppointments = async () => {
  await stubCreateAppointmentScenario({ date: new Date('2030-01-02'), nonAssociations: true, attendees: 'group' })
  await stubManageAppointmentScenario(new Date('2030-01-02'))
  await stubEndpoint('GET', '/appointment-set/1/details', {
    ...appointmentDetails,
    id: 1,
    appointments: [appointmentDetails],
  })
}
