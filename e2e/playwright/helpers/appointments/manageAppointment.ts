import { addDays, format } from 'date-fns'

import getAppointmentDetailsFixture from '../../../../integration_tests/fixtures/activitiesApi/getAppointmentDetails.json'
import getAppointmentLocations from '../../../../integration_tests/fixtures/prisonApi/getMdiAppointmentLocations.json'
import getAppointmentSearchResults from '../../../../integration_tests/fixtures/activitiesApi/getAppointmentSearchResults.json'
import getAppointmentSeries from '../../../../integration_tests/fixtures/activitiesApi/getAppointmentSeries.json'
import getCancelledAppointmentDetailsFixture from '../../../../integration_tests/fixtures/activitiesApi/getCancelledAppointmentDetails.json'
import getCancelledAppointmentSeriesFixture from '../../../../integration_tests/fixtures/activitiesApi/getCancelledAppointmentSeries.json'
import getCategories from '../../../../integration_tests/fixtures/activitiesApi/getAppointmentCategories.json'
import getGroupAppointmentSeriesDetailsFixture from '../../../../integration_tests/fixtures/activitiesApi/getGroupAppointmentSeriesDetails.json'
import getPrisonerAlerts from '../../../../integration_tests/fixtures/alertsApi/getPrisonerAlerts.json'
import getPrisonersFixture from '../../../../integration_tests/fixtures/prisonerSearchApi/postPrisonerNumbers-A1350DZ-A8644DY-A1351DZ.json'
import getScheduledEvents from '../../../../integration_tests/fixtures/activitiesApi/getScheduledEventsMdi20230202.json'
import { stubEndpoint } from '../../../../integration_tests/mockApis/wiremock'

type AppointmentDetailsFixture = typeof getAppointmentDetailsFixture | typeof getCancelledAppointmentDetailsFixture

export type ManageAppointmentScenario = {
  activeDetails: AppointmentDetailsFixture
  cancelledDetails: AppointmentDetailsFixture
}

const clone = <T>(fixture: T): T => JSON.parse(JSON.stringify(fixture)) as T

export const stubAppointmentDetails = (details: AppointmentDetailsFixture) =>
  stubEndpoint('GET', '/appointments/11/details', details)

const stubManageAppointmentScenario = async (
  appointmentDate: Date,
  seriesWithCancelledAppointments = false,
): Promise<ManageAppointmentScenario> => {
  const formattedDate = format(appointmentDate, 'yyyy-MM-dd')
  const activeDetails = clone(getAppointmentDetailsFixture)
  const cancelledDetails = clone(getCancelledAppointmentDetailsFixture)
  const groupSeriesDetails = clone(getGroupAppointmentSeriesDetailsFixture)
  const prisoners = clone(getPrisonersFixture)

  activeDetails.startDate = formattedDate
  cancelledDetails.startDate = formattedDate
  cancelledDetails.cancelledTime = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss")
  groupSeriesDetails.startDate = formattedDate
  groupSeriesDetails.appointments[0].startDate = formattedDate
  prisoners[0].status = 'ACTIVE_IN'
  prisoners[1].inOutStatus = 'IN'

  await stubEndpoint('GET', '/appointment-categories', getCategories)
  await stubEndpoint('GET', '/appointment-locations/MDI', getAppointmentLocations)
  await stubEndpoint('POST', '/appointments/MDI/search', getAppointmentSearchResults)
  await stubEndpoint('POST', '/prisoner-search/prisoner-numbers', prisoners)
  await stubEndpoint('GET', '/users/jsmith', {
    name: 'John Smith',
    username: 'jsmith',
    authSource: 'nomis',
  })
  await stubEndpoint('GET', '/users/AAA01U', {
    name: 'Activity User',
    username: 'AAA01U',
    authSource: 'nomis',
  })
  await stubEndpoint('POST', '/search/alerts/prison-numbers\\?includeInactive=false', getPrisonerAlerts)
  await stubEndpoint('POST', `/scheduled-events/prison/MDI\\?date=${formattedDate}`, getScheduledEvents)
  await stubEndpoint('PUT', '/appointments/11/cancel', cancelledDetails)
  await stubEndpoint('PUT', '/appointments/11/uncancel', activeDetails)

  if (seriesWithCancelledAppointments) {
    const cancelledSeries = clone(getCancelledAppointmentSeriesFixture)
    const followingDate = format(addDays(appointmentDate, 1), 'yyyy-MM-dd')
    cancelledSeries.appointments = cancelledSeries.appointments.map(appointment => ({
      ...appointment,
      startDate: followingDate,
    }))
    activeDetails.appointmentSeries = { id: 10 }
    cancelledDetails.appointmentSeries = { id: 10 }

    await stubEndpoint('GET', '/appointment-series/10/details', cancelledSeries)
    await stubEndpoint('POST', '/appointment-series', cancelledSeries)
  } else {
    await stubEndpoint('GET', '/appointment-series/10/details', groupSeriesDetails)
    await stubEndpoint('POST', '/appointment-series', getAppointmentSeries)
  }

  await stubAppointmentDetails(activeDetails)

  return { activeDetails, cancelledDetails }
}

export default stubManageAppointmentScenario
