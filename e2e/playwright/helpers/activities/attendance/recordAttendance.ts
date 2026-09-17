import { format } from 'date-fns'

import getAttendanceSummary from '../../../../../integration_tests/fixtures/activitiesApi/getAttendanceSummary.json'
import getScheduledInstanceEnglishLevel1 from '../../../../../integration_tests/fixtures/activitiesApi/getScheduledInstance93.json'
import getScheduledInstanceEnglishLevel2 from '../../../../../integration_tests/fixtures/activitiesApi/getScheduledInstance11.json'
import getAttendeesForScheduledInstance from '../../../../../integration_tests/fixtures/activitiesApi/getAttendeesScheduledInstance93.json'
import getScheduledEvents from '../../../../../integration_tests/fixtures/activitiesApi/getScheduledEventsMdi20230202.json'
import getInmateDetails from '../../../../../integration_tests/fixtures/prisonerSearchApi/getInmateDetailsForAttendance.json'
import getCategories from '../../../../../integration_tests/fixtures/activitiesApi/getCategories.json'
import getNonResidentialActivityLocations from '../../../../../integration_tests/fixtures/locationsinsideprison/non-residential-usage-activities.json'
import getLocationGroups from '../../../../../integration_tests/fixtures/activitiesApi/getLocationGroups.json'
import getPrisonPrisoners from '../../../../../integration_tests/fixtures/prisonerSearchApi/getPrisonPrisoners-MDI-A1350DZ-A8644DY.json'

import { stubEndpoint } from '../../../../../integration_tests/mockApis/wiremock'

const today = (): string => format(new Date(), 'yyyy-MM-dd')

const multipleActivityInstances = () => {
  const englishLevel1 = structuredClone(getScheduledInstanceEnglishLevel1)
  const englishLevel2 = structuredClone(getScheduledInstanceEnglishLevel2)

  englishLevel1.date = today()
  englishLevel2.date = today()

  englishLevel1.attendances[2].status = 'WAITING'
  englishLevel1.attendances[2].attendanceReason = null

  englishLevel2.attendances[2].status = 'WAITING'
  englishLevel2.attendances[2].attendanceReason = null

  return [englishLevel1, englishLevel2]
}

export const stubMultipleActivitiesAttended = async (): Promise<void> => {
  const [englishLevel1, englishLevel2] = multipleActivityInstances()

  englishLevel1.attendances[2].status = 'COMPLETED'
  englishLevel1.attendances[2].attendanceReason = {
    code: 'ATTENDED',
    description: 'Attended',
  }

  englishLevel2.attendances[2].status = 'COMPLETED'
  englishLevel2.attendances[2].attendanceReason = {
    code: 'ATTENDED',
    description: 'Attended',
  }

  await stubEndpoint('POST', '/scheduled-instances', [englishLevel1, englishLevel2])
}

export const setupMultipleActivityAttendance = async (): Promise<void> => {
  const date = today()
  const [englishLevel1, englishLevel2] = multipleActivityInstances()

  await Promise.all([
    stubEndpoint('GET', `/scheduled-instances/attendance-summary\\?prisonCode=MDI&date=${date}`, getAttendanceSummary),
    stubEndpoint('GET', '/scheduled-instances/93', englishLevel1),
    stubEndpoint('GET', '/scheduled-instances/11', englishLevel2),
    stubEndpoint('GET', '/scheduled-instances/93/scheduled-attendees', getAttendeesForScheduledInstance),
    stubEndpoint('POST', '/scheduled-instances', [englishLevel1, englishLevel2]),
    stubEndpoint('POST', `/scheduled-events/prison/MDI\\?date=${date}`, getScheduledEvents),
    stubEndpoint('POST', '/prisoner-search/prisoner-numbers', getInmateDetails),
    stubEndpoint('PUT', '/attendances'),
    stubEndpoint('GET', '/activity-categories', getCategories),
    stubEndpoint(
      'GET',
      '/locations/prison/MDI/non-residential-usage-type\\?formatLocalName=true',
      getNonResidentialActivityLocations,
    ),
  ])
}

const residentialInstance = () => {
  const fixture = structuredClone(getScheduledInstanceEnglishLevel2)

  return {
    ...fixture,
    date: today(),
    attendances: [
      {
        id: 1,
        prisonerNumber: 'A1350DZ',
        attendanceReason: null,
        comment: null,
        posted: false,
        recordedTime: null,
        recordedBy: null,
        status: 'WAITING',
        payAmount: null,
        bonusAmount: null,
        pieces: null,
        issuePayment: false,
        editable: true,
        scheduleInstanceId: 11,
      },
      {
        id: 2,
        prisonerNumber: 'A8644DY',
        attendanceReason: null,
        comment: null,
        posted: false,
        recordedTime: null,
        recordedBy: null,
        status: 'WAITING',
        payAmount: null,
        bonusAmount: null,
        pieces: null,
        issuePayment: false,
        editable: true,
        scheduleInstanceId: 11,
      },
    ],
  }
}

export const setupResidentialAttendance = async (): Promise<void> => {
  const date = today()
  const instance = residentialInstance()

  const locationPrefix = 'MDI-1-1-0(0[1-9]|1[0-2]),MDI-1-2-0(0[1-9]|1[0-2]),MDI-1-3-0(0[1-9]|1[0-2])'

  await Promise.all([
    stubEndpoint('GET', `/scheduled-instances/attendance-summary\\?prisonCode=MDI&date=${date}`, getAttendanceSummary),
    stubEndpoint(
      'GET',
      '/locations/prison/MDI/non-residential-usage-type\\?formatLocalName=true',
      getNonResidentialActivityLocations,
    ),
    stubEndpoint('GET', '/locations/prison/MDI/location-groups', getLocationGroups),
    stubEndpoint('GET', `/prisons/MDI/scheduled-instances\\?startDate=${date}&endDate=${date}&slot=AM`, [instance]),
    stubEndpoint('POST', '/scheduled-instances', [instance]),
    stubEndpoint('POST', '/locations/prison/MDI/location-prefixes\\?locationKey=Houseblock%201', [
      {
        locationPrefix: 'MDI-1-.+',
        subLocation: 'A-Wing',
      },
      {
        locationPrefix,
        subLocation: 'A-Wing',
      },
    ]),
    stubEndpoint('GET', '/locations/prison/MDI/location-prefix\\?groupName=Houseblock%201', {
      locationPrefix: 'MDI-1-.+',
    }),
    stubEndpoint(
      'GET',
      '/prison/MDI/prisoners\\?page=0&size=1024&cellLocationPrefix=MDI-1-&sort=cellLocation',
      getPrisonPrisoners,
    ),
    stubEndpoint('POST', `/scheduled-events/prison/MDI\\?date=${date}`, getScheduledEvents),
    stubEndpoint('PUT', '/attendances'),
  ])
}
