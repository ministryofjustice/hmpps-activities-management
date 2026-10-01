import { format } from 'date-fns'
import { JourneyData } from '../../../../server/@types/express'
import { stubEndpoint } from '../../../../integration_tests/mockApis/wiremock'
import { setupMultipleActivityAttendance } from '../../helpers/activities/attendance/recordAttendance'
import instanceFixture from '../../../../integration_tests/fixtures/activitiesApi/getScheduledInstance93.json'
import prisoners from '../../../../integration_tests/fixtures/prisonerSearchApi/getInmateDetailsForAttendance.json'
import reasons from '../../../../integration_tests/fixtures/activitiesApi/getAttendanceReasons.json'
import categories from '../../../../integration_tests/fixtures/activitiesApi/getCategoriesIncludingRotl.json'
import locations from '../../../../integration_tests/fixtures/activitiesApi/getLocationGroups.json'
import activities from '../../../../integration_tests/fixtures/activitiesApi/getActivities.json'
import activity from '../../../../integration_tests/fixtures/activitiesApi/getActivity.json'
import { Screen } from './run'

const selectedPrisoner = {
  instanceId: 93,
  attendanceId: 4,
  prisonerNumber: 'A7789DY',
  prisonerName: 'Test Prisoner',
  firstName: 'Test',
  lastName: 'Prisoner',
  otherEvents: [],
}
export const attendanceJourney = (screen: Screen): JourneyData => {
  const multiple = screen.id.endsWith('not-attended-reason-multiple')
  let selectedInstanceIds = ['93', '11']
  if (screen.id.endsWith('confirm-single')) selectedInstanceIds = ['93']
  if (screen.id.includes('/attend-all/')) selectedInstanceIds = ['93-attendance-A7789DY']
  return {
    recordAttendanceJourney: {
      activityDate: format(new Date(), 'yyyy-MM-dd'),
      sessionFilters: ['AM', 'PM'],
      selectedInstanceIds,
      notAttended: {
        selectedPrisoners: multiple
          ? [selectedPrisoner, { ...selectedPrisoner, prisonerNumber: 'G7218GI', attendanceId: 5 }]
          : [selectedPrisoner],
      },
      notRequiredOrExcused: { selectedPrisoners: [selectedPrisoner], isPaid: true },
      sessionCancellation: { activityName: 'English level 1', reason: 'Staff unavailable', issuePayment: true },
      sessionCancellationSingle: { activityName: 'English level 1', reason: 'Staff unavailable', issuePayment: true },
      sessionCancellationMultiple: { reason: 'Staff unavailable', issuePayment: true },
    },
  }
}
export const stubAttendance = async (screen: Screen) => {
  await setupMultipleActivityAttendance()
  const instance = { ...structuredClone(instanceFixture), date: format(new Date(), 'yyyy-MM-dd') }
  const attendance = { ...instance.attendances[0], recordedBy: 'USER1', recordedTime: '2023-02-02T15:00:00' }
  await Promise.all([
    stubEndpoint('GET', '/prison/MDI/prisoners.*', { content: [], totalElements: 0 }),
    stubEndpoint('GET', '/scheduled-instances/93', instance),
    stubEndpoint('GET', '/attendance-reasons', reasons),
    stubEndpoint('GET', '/activity-categories.*', categories),
    stubEndpoint('GET', '/prison/MDI/activities.*', activities),
    stubEndpoint('GET', '/activities/2/filtered.*', activity),
    stubEndpoint('GET', '/locations/prison/MDI/location-groups', locations),
    stubEndpoint(
      'GET',
      '/prisons/MDI/scheduled-instances.*',
      screen.id.endsWith('no-activities-for-selection') ? [] : [instance],
    ),
    stubEndpoint('GET', '/attendances/4', attendance),
    stubEndpoint('GET', '/advance-attendances/1', {
      ...attendance,
      id: 1,
      attendanceReason: 'EXCUSED',
      issuePayment: true,
    }),
    stubEndpoint(
      'GET',
      '/prisoner/A7789DY',
      prisoners.find(p => p.prisonerNumber === 'A7789DY'),
    ),
    stubEndpoint('GET', '/users/USER1', { username: 'USER1', name: 'Test User', authSource: 'nomis' }),
    stubEndpoint('GET', '/users/AAA01U', { username: 'AAA01U', name: 'Test User', authSource: 'nomis' }),
    stubEndpoint('GET', '/locations/prison/MDI/location-prefix.*', { locationPrefix: 'MDI-1-.+' }),
    stubEndpoint('POST', '/locations/prison/MDI/location-prefixes.*', []),
  ])
}
