import { format } from 'date-fns'

import getInternalLocationEvents from '../../../../../integration_tests/fixtures/activitiesApi/getInteralLocationEvents.json'
import externalMovements from '../../../../../integration_tests/fixtures/activitiesApi/externalMovements.json'
import getInmateDetailsForMovementList from '../../../../../integration_tests/fixtures/prisonerSearchApi/getInmateDetailsForMovementList.json'
import getScheduledEventsForMovementList from '../../../../../integration_tests/fixtures/activitiesApi/getScheduleEvents-MDI-A1350DZ-A8644DY.json'
import { stubEndpoint } from '../../../../../integration_tests/mockApis/wiremock'

const today = (): string => format(new Date(), 'yyyy-MM-dd')

export const setupOutsideMovementList = async (): Promise<void> => {
  const date = today()

  await Promise.all([
    stubEndpoint('GET', `/locations/prison/MDI/events-summaries\\?date=${date}&timeSlot=AM`, getInternalLocationEvents),
    stubEndpoint(
      'GET',
      `/scheduled-events/prison/MDI/scheduled-external-movements\\?date=${date}&timeSlot=AM`,
      externalMovements,
    ),
    stubEndpoint('POST', '/prisoner-search/prisoner-numbers', getInmateDetailsForMovementList),
    stubEndpoint('POST', `/scheduled-events/prison/MDI\\?date=${date}`, getScheduledEventsForMovementList),
  ])
}
