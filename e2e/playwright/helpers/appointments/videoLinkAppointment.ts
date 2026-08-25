import { format } from 'date-fns'

import getAppointmentLocations from '../../../../integration_tests/fixtures/prisonApi/getMdiAppointmentLocations.json'
import getBvlsLocations from '../../../../integration_tests/fixtures/bookAVideoLinkApi/getBvlsLocations.json'
import getBvlsVccRoom1 from '../../../../integration_tests/fixtures/bookAVideoLinkApi/getBvlsLocation-VCC_ROOM_1.json'
import getCategories from '../../../../integration_tests/fixtures/activitiesApi/getAppointmentCategories.json'
import getCompletedCourtBookingFixture from '../../../../integration_tests/fixtures/bookAVideoLinkApi/getCompletedCourtBooking.json'
import getCompletedProbationBookingFixture from '../../../../integration_tests/fixtures/bookAVideoLinkApi/getCompletedProbationBooking.json'
import getCourtHearingTypes from '../../../../integration_tests/fixtures/bookAVideoLinkApi/getCourtHearingTypes.json'
import getCourtList from '../../../../integration_tests/fixtures/bookAVideoLinkApi/getCourtList.json'
import getFourProbationMeetingTypes from '../../../../integration_tests/fixtures/bookAVideoLinkApi/getFourProbationMeetingTypes.json'
import getInternalLocationEventsByDpsLocationId from '../../../../integration_tests/fixtures/activitiesApi/getInternalLocationEventsByDpsLocationId.json'
import getPrisonerA8644DY from '../../../../integration_tests/fixtures/prisonerSearchApi/getPrisoner-MDI-A8644DY.json'
import getPrisonerAlerts from '../../../../integration_tests/fixtures/alertsApi/getPrisonerAlertsA8644DY.json'
import getPrisoners from '../../../../integration_tests/fixtures/prisonerSearchApi/getPrisonPrisoners-MDI-A8644DY.json'
import getProbationTeamList from '../../../../integration_tests/fixtures/bookAVideoLinkApi/getProbationTeamList.json'
import getScheduledEventsFixture from '../../../../integration_tests/fixtures/activitiesApi/getScheduleEvents-MDI-A1350DZ-A8644DY.json'
import { stubEndpoint } from '../../../../integration_tests/mockApis/wiremock'

type VideoLinkType = 'court' | 'probation'

const clone = <T>(fixture: T): T => JSON.parse(JSON.stringify(fixture)) as T

const stubVideoLinkAppointmentScenario = async (date: Date, type: VideoLinkType): Promise<void> => {
  const appointmentDate = format(date, 'yyyy-MM-dd')
  const scheduledEvents = {
    ...clone(getScheduledEventsFixture),
    activities: getScheduledEventsFixture.activities.map(event => ({
      ...event,
      date: event.prisonerNumber === 'A8644DY' ? appointmentDate : event.date,
    })),
  }

  await stubEndpoint('GET', '/appointment-categories', getCategories)
  await stubEndpoint('POST', `/scheduled-events/prison/MDI\\?date=${appointmentDate}`, scheduledEvents)
  await stubEndpoint(
    'GET',
    `/scheduled-events/prison/MDI/location-events\\?date=${appointmentDate}&dpsLocationId=abcd-1234-abcd-1234`,
    getInternalLocationEventsByDpsLocationId,
  )
  await stubEndpoint('GET', '/users/jsmith', {
    name: 'John Smith',
    username: 'jsmith',
    authSource: 'nomis',
  })
  await stubEndpoint('POST', '/search/alerts/prison-numbers\\?includeInactive=false', getPrisonerAlerts)
  await stubEndpoint('POST', '/non-associations/between', [])
  await stubEndpoint('GET', '/prison/MDI/prisoners\\?term=A8644DY&size=50', getPrisoners)
  await stubEndpoint('GET', '/prisoner/A8633DY', getPrisoners)
  await stubEndpoint('GET', '/prisoner/A8644DY', getPrisonerA8644DY)
  await stubEndpoint('GET', '/appointment-locations/MDI', getAppointmentLocations)
  await stubEndpoint('GET', '/prisons/MDI/locations\\?videoLinkOnly=false', getBvlsLocations)
  await stubEndpoint('GET', '/api/locations/code/VCC-ROOM-1', getBvlsVccRoom1)
  await stubEndpoint('POST', '/video-link-booking', 1234)

  if (type === 'court') {
    const completedBooking = clone(getCompletedCourtBookingFixture)
    completedBooking.prisonAppointments[0].appointmentDate = appointmentDate

    await stubEndpoint('GET', '/courts\\?enabledOnly=false', getCourtList)
    await stubEndpoint('GET', '/reference-codes/group/COURT_HEARING_TYPE', getCourtHearingTypes)
    await stubEndpoint('GET', '/video-link-booking/id/1234', completedBooking)
    return
  }

  const completedBooking = clone(getCompletedProbationBookingFixture)
  completedBooking.prisonAppointments[0].appointmentDate = appointmentDate

  await stubEndpoint('GET', '/probation-teams\\?enabledOnly=false', getProbationTeamList)
  await stubEndpoint('GET', '/reference-codes/group/PROBATION_MEETING_TYPE', getFourProbationMeetingTypes)
  await stubEndpoint('GET', '/video-link-booking/id/1234', completedBooking)
}

export default stubVideoLinkAppointmentScenario
