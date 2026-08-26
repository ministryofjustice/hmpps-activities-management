import { format } from 'date-fns'

import getInternalLocationEvents from '../../../../../integration_tests/fixtures/activitiesApi/getInteralLocationEvents.json'
import externalMovements from '../../../../../integration_tests/fixtures/activitiesApi/externalMovements.json'
import getInmateDetailsForMovementList from '../../../../../integration_tests/fixtures/prisonerSearchApi/getInmateDetailsForMovementList.json'
import getScheduledEventsForMovementList from '../../../../../integration_tests/fixtures/activitiesApi/getScheduleEvents-MDI-A1350DZ-A8644DY.json'
import getLocationGroups from '../../../../../integration_tests/fixtures/activitiesApi/getLocationGroups.json'
import getPrisonPrisoners from '../../../../../integration_tests/fixtures/prisonerSearchApi/getPrisonPrisoners-MDI-A1350DZ-A8644DY.json'
import getCategories from '../../../../../integration_tests/fixtures/activitiesApi/getCategories.json'
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

export const setupUnlockList = async (): Promise<void> => {
  const date = today()

  const scheduledEventsFixture = structuredClone(getScheduledEventsForMovementList)

  const prisonerFixture = structuredClone(getPrisonPrisoners)

  const scheduledEvents = {
    ...scheduledEventsFixture,
    courtHearings: [
      ...scheduledEventsFixture.courtHearings,
      {
        prisonCode: 'MDI',
        eventSource: 'NOMIS',
        eventType: 'COURT_HEARING',
        eventId: 10001,
        bookingId: 10001,
        internalLocationDescription: 'Bradford County Court',
        summary: 'Court hearing',
        prisonerNumber: 'A2345DP',
        date,
        startTime: '13:00',
        endTime: '15:00',
        priority: 1,
      },
    ],
  }

  const prisoners = {
    ...prisonerFixture,
    totalElements: 3,
    size: 3,
    content: [
      ...prisonerFixture.content,
      {
        prisonerNumber: 'A2345DP',
        bookingId: '1202189',
        bookNumber: '39298A',
        firstName: 'TEST',
        lastName: 'COURTEE',
        dateOfBirth: '1970-01-01',
        gender: 'Male',
        youthOffender: false,
        status: 'ACTIVE IN',
        lastMovementTypeCode: 'ADM',
        lastMovementReasonCode: 'I',
        inOutStatus: 'IN',
        prisonId: 'MDI',
        prisonName: 'Moorland (HMP & YOI)',
        cellLocation: '1-3-015',
        category: 'C',
        aliases: [],
        alerts: [],
        legalStatus: 'SENTENCED',
        imprisonmentStatus: 'UNK_SENT',
        imprisonmentStatusDescription: 'Unknown Sentenced',
        mostSeriousOffence: 'Drive vehicle for more than 13 hours or more in a working day - domestic',
        recall: false,
        indeterminateSentence: false,
        receptionDate: '2022-04-25',
        locationDescription: 'Moorland (HMP & YOI)',
        restrictedPatient: false,
        currentIncentive: {
          level: {
            code: 'ENH',
            description: 'Enhanced',
          },
          dateTime: '2022-04-25T12:16:58',
          nextReviewDate: '2023-04-25',
        },
      },
    ],
  }

  await Promise.all([
    stubEndpoint('GET', '/locations/prison/MDI/location-groups', getLocationGroups),
    stubEndpoint('GET', '/users/SCH_ACTIVITY', {
      name: 'Schedule Activity',
      username: 'jsmith',
    }),
    stubEndpoint('POST', '/locations/prison/MDI/location-prefixes\\?locationKey=Houseblock%201', [
      {
        locationPrefix: 'MDI-1-.+',
        subLocation: 'A-Wing',
      },
      {
        locationPrefix: 'MDI-1-1-0(0[1-9]|1[0-2]),MDI-1-2-0(0[1-9]|1[0-2]),MDI-1-3-0(0[1-9]|1[0-2])',
        subLocation: 'A-Wing',
      },
      {
        locationPrefix: 'MDI-1-1-0(1[3-9]|2[0-6]),MDI-1-2-0(1[3-9]|2[0-6]),MDI-1-3-0(1[3-9]|2[0-6])',
        subLocation: 'A-Wing',
      },
      {
        locationPrefix: 'MDI-1-1-0(2[7-9]|3[0-8]),MDI-1-2-0(2[7-9]|3[0-8]),MDI-1-3-0(2[7-9]|3[0-8])',
        subLocation: 'A-Wing',
      },
    ]),
    stubEndpoint('GET', '/locations/prison/MDI/location-prefix\\?groupName=Houseblock%201', {
      locationPrefix: 'MDI-1-.+',
    }),
    stubEndpoint(
      'GET',
      '/prison/MDI/prisoners\\?page=0&size=1024&cellLocationPrefix=MDI-1-&sort=cellLocation',
      prisoners,
    ),
    stubEndpoint(
      'POST',
      `/scheduled-events/prison/MDI\\?date=${date}&timeSlot=AM&includeExternalMovements=true`,
      scheduledEvents,
    ),
    stubEndpoint('GET', '/activity-categories', getCategories),
  ])
}
