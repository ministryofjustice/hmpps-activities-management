import { accessibilityArea } from './support/run'
import stubVideoLinkAppointmentScenario from '../helpers/appointments/videoLinkAppointment'
import { stubEndpoint } from '../../../integration_tests/mockApis/wiremock'
import { BookACourtHearingJourney } from '../../../server/routes/appointments/video-link-booking/court/journey'
import { BookAProbationMeetingJourney } from '../../../server/routes/appointments/video-link-booking/probation/journey'

const prisoner = {
  number: 'A8644DY',
  name: 'Stephen Gregs',
  firstName: 'Stephen',
  lastName: 'Gregs',
  prisonCode: 'MDI',
  status: 'ACTIVE IN',
  cellLocation: '1-1-1',
}
const common = {
  bookingId: 1234,
  prisoner,
  prisoners: [prisoner, { ...prisoner, number: 'A1350DZ', name: 'David Winchurch' }],
  prisonCode: 'MDI',
  date: '2030-01-02T00:00:00Z',
  startTime: '2030-01-02T14:00:00Z',
  endTime: '2030-01-02T15:30:00Z',
  locationId: 'abcd-1234-abcd-1234',
}
const court: BookACourtHearingJourney = {
  ...common,
  courtCode: 'AYLCRN',
  hearingTypeCode: 'BAIL',
  cvpRequired: false,
  guestPinRequired: false,
}
const probation: BookAProbationMeetingJourney = {
  ...common,
  probationTeamRequired: true,
  probationTeamCode: 'BLKPPP',
  meetingTypeCode: 'PSR',
  probationOfficerDetailsKnown: false,
}
const setup = async (type: 'court' | 'probation') => {
  await stubVideoLinkAppointmentScenario(new Date('2030-01-02'), type)
  await stubEndpoint('GET', '/users/.*', { username: 'jsmith', name: 'John Smith', authSource: 'nomis' })
  await stubEndpoint('POST', '/appointments/MDI/search', [])
}
// Both booking types currently use sessionDataMap rather than the Redis journey token store.
accessibilityArea(
  'appointments/video-link-booking/court',
  () => setup('court'),
  {},
  { bookACourtHearingJourney: court },
)
accessibilityArea(
  'appointments/video-link-booking/probation',
  () => setup('probation'),
  {},
  { bookAProbationMeetingJourney: probation },
)
