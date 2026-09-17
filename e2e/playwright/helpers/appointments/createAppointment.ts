import { format } from 'date-fns'

import getAppointmentDetails from '../../../../integration_tests/fixtures/activitiesApi/getAppointmentDetails.json'
import getAppointmentLocations from '../../../../integration_tests/fixtures/prisonApi/getMdiAppointmentLocations.json'
import getAppointmentSeries from '../../../../integration_tests/fixtures/activitiesApi/getAppointmentSeries.json'
import getAppointmentSeriesDetails from '../../../../integration_tests/fixtures/activitiesApi/getAppointmentSeriesDetails.json'
import getCategories from '../../../../integration_tests/fixtures/activitiesApi/getAppointmentCategories.json'
import getGroupAppointmentDetails from '../../../../integration_tests/fixtures/activitiesApi/getGroupAppointmentDetails.json'
import getGroupAppointmentSeriesDetails from '../../../../integration_tests/fixtures/activitiesApi/getGroupAppointmentSeriesDetails.json'
import getNonAssociations from '../../../../integration_tests/fixtures/nonAssociationsApi/getNonAssociationsBetweenA8644DYA1350DZ.json'
import getPrisonerA1351DZ from '../../../../integration_tests/fixtures/prisonerSearchApi/getPrisoner-MDI-A1351DZ.json'
import getPrisonerA8644DY from '../../../../integration_tests/fixtures/prisonerSearchApi/getPrisoner-MDI-A8644DY.json'
import getPrisonerAlerts from '../../../../integration_tests/fixtures/alertsApi/getPrisonerAlerts.json'
import getPrisonerAlertsA8644DY from '../../../../integration_tests/fixtures/alertsApi/getPrisonerAlertsA8644DY.json'
import getPrisonersA1351DZ from '../../../../integration_tests/fixtures/prisonerSearchApi/getPrisonPrisoners-MDI-A1351DZ.json'
import getPrisonersA8644DY from '../../../../integration_tests/fixtures/prisonerSearchApi/getPrisonPrisoners-MDI-A8644DY.json'
import getPrisonersFromCsv from '../../../../integration_tests/fixtures/prisonerSearchApi/postPrisonerNumbers-A1350DZ-A8644DY.json'
import getScheduledEventsFixture from '../../../../integration_tests/fixtures/activitiesApi/getScheduledEventsMdi20230202.json'
import { AppointmentFrequency } from '../../../../server/@types/appointments'
import { stubEndpoint } from '../../../../integration_tests/mockApis/wiremock'

type CreateAppointmentScenario = {
  date: Date
  attendees?: 'one' | 'group'
  repeat?: boolean
  nonAssociations?: boolean
}

type SeriesDetails = {
  startDate: string
  appointments: Array<{ startDate: string }>
  schedule?: { frequency: AppointmentFrequency; numberOfAppointments: number }
}

type AppointmentDetails = {
  startDate: string
  appointmentSeries: {
    id: number
    schedule?: { frequency: AppointmentFrequency; numberOfAppointments: number }
  }
}

const clone = <T>(fixture: T): T => JSON.parse(JSON.stringify(fixture)) as T

const stubCreateAppointmentScenario = async ({
  date,
  attendees = 'one',
  repeat = false,
  nonAssociations = false,
}: CreateAppointmentScenario): Promise<void> => {
  const appointmentDate = format(date, 'yyyy-MM-dd')
  const scheduledEvents = {
    ...clone(getScheduledEventsFixture),
    activities: getScheduledEventsFixture.activities.map(event => ({
      ...event,
      prisonerNumber:
        {
          A7789DY: 'A1350DZ',
          G7218GI: 'A8644DY',
          G5897GP: 'A1351DZ',
        }[event.prisonerNumber] ?? event.prisonerNumber,
    })),
  }

  const seriesDetails = clone(
    attendees === 'group' ? getGroupAppointmentSeriesDetails : getAppointmentSeriesDetails,
  ) as unknown as SeriesDetails
  const appointmentDetails = clone(
    attendees === 'group' ? getGroupAppointmentDetails : getAppointmentDetails,
  ) as unknown as AppointmentDetails

  seriesDetails.startDate = appointmentDate
  seriesDetails.appointments[0].startDate = appointmentDate
  appointmentDetails.startDate = appointmentDate

  if (repeat) {
    seriesDetails.schedule = {
      frequency: AppointmentFrequency.DAILY,
      numberOfAppointments: 7,
    }
    appointmentDetails.appointmentSeries.schedule = {
      frequency: AppointmentFrequency.DAILY,
      numberOfAppointments: 7,
    }
  }

  await stubEndpoint('GET', '/prison/MDI/prisoners\\?term=A8644DY&size=50', getPrisonersA8644DY)
  await stubEndpoint('GET', '/prisoner/A8644DY', getPrisonerA8644DY)
  await stubEndpoint('GET', '/prison/MDI/prisoners\\?term=lee&size=50', getPrisonersA1351DZ)
  await stubEndpoint('GET', '/prisoner/A1351DZ', getPrisonerA1351DZ)
  await stubEndpoint('POST', '/prisoner-search/prisoner-numbers', getPrisonersFromCsv)
  await stubEndpoint('GET', '/appointment-categories', getCategories)
  await stubEndpoint('GET', '/appointment-locations/MDI', getAppointmentLocations)
  await stubEndpoint('POST', `/scheduled-events/prison/MDI\\?date=${appointmentDate}`, scheduledEvents)
  await stubEndpoint('POST', '/appointment-series', getAppointmentSeries)
  await stubEndpoint('GET', '/appointment-series/10/details', seriesDetails)
  await stubEndpoint('GET', '/appointments/11/details', appointmentDetails)
  await stubEndpoint('GET', '/users/jsmith', {
    name: 'John Smith',
    username: 'jsmith',
    authSource: 'nomis',
  })
  await stubEndpoint(
    'POST',
    '/search/alerts/prison-numbers\\?includeInactive=false',
    attendees === 'group' ? getPrisonerAlerts : getPrisonerAlertsA8644DY,
  )
  await stubEndpoint('POST', '/non-associations/between', nonAssociations ? getNonAssociations : [])
}

export default stubCreateAppointmentScenario
