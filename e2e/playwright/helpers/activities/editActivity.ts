import { addDays, format } from 'date-fns'

import getActivity from '../../../../integration_tests/fixtures/activitiesApi/getActivity.json'
import getAllocations from '../../../../integration_tests/fixtures/activitiesApi/getAllocations.json'
import prisonerAllocations from '../../../../integration_tests/fixtures/activitiesApi/prisonerAllocations.json'
import getCandidates from '../../../../integration_tests/fixtures/activitiesApi/getCandidates.json'
import getPrisonRegime from '../../../../integration_tests/fixtures/activitiesApi/getPrisonRegime.json'
import moorlandPayBands from '../../../../integration_tests/fixtures/activitiesApi/getMdiPrisonPayBands.json'
import moorlandIncentiveLevels from '../../../../integration_tests/fixtures/incentivesApi/getMdiPrisonIncentiveLevels.json'
import getPayProfile from '../../../../integration_tests/fixtures/prisonApi/getPayProfile.json'

import { stubEndpoint } from '../../../../integration_tests/mockApis/wiremock'

const stubEditTwoWeekActivity = async (): Promise<void> => {
  const activityFixture = structuredClone(getActivity)

  const activity = {
    ...activityFixture,
    schedules: activityFixture.schedules.map((schedule, index) =>
      index === 0
        ? {
            ...schedule,
            activity: {
              ...schedule.activity,
              paid: true,
            },
          }
        : schedule,
    ),
  }

  activity.schedules[0].startDate = format(addDays(new Date(), 1), 'yyyy-MM-dd')
  activity.schedules[0].usePrisonRegimeTime = false
  activity.schedules[0].scheduleWeeks = 2

  activity.schedules[0].slots = [
    {
      id: 2051,
      timeSlot: 'AM',
      weekNumber: 1,
      startTime: '09:00',
      endTime: '12:00',
      daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu'],
      mondayFlag: true,
      tuesdayFlag: true,
      wednesdayFlag: true,
      thursdayFlag: true,
      fridayFlag: false,
      saturdayFlag: false,
      sundayFlag: false,
    },
    {
      id: 2052,
      timeSlot: 'PM',
      weekNumber: 2,
      startTime: '13:30',
      endTime: '17:00',
      daysOfWeek: ['Mon', 'Tue', 'Wed'],
      mondayFlag: true,
      tuesdayFlag: true,
      wednesdayFlag: true,
      thursdayFlag: false,
      fridayFlag: false,
      saturdayFlag: false,
      sundayFlag: false,
    },
  ]

  const inmateDetails = [
    {
      prisonerNumber: 'A9477DY',
      firstName: 'JOHN',
      lastName: 'JONES',
    },
    {
      prisonerNumber: 'G4793VF',
      firstName: 'JACK',
      lastName: 'SMITH',
    },
  ]

  await Promise.all([
    stubEndpoint('GET', '/prison/MDI/prison-pay-bands', moorlandPayBands),
    stubEndpoint('GET', '/incentive/prison-levels/MDI', moorlandIncentiveLevels),
    stubEndpoint('GET', '/api/agencies/MDI/pay-profile', getPayProfile),
    stubEndpoint('GET', '/schedules/2/allocations\\?activeOnly=true&includePrisonerSummary=true', getAllocations),
    stubEndpoint('POST', '/prisons/MDI/prisoner-allocations', prisonerAllocations),
    stubEndpoint('GET', '/schedules/2/candidates(.)*', getCandidates),
    stubEndpoint('POST', '/schedules/2/allocations'),
    stubEndpoint('GET', '/prison/prison-regime/MDI', getPrisonRegime),
    stubEndpoint('POST', '/prisoner-search/prisoner-numbers', inmateDetails),
    stubEndpoint('GET', '/activities/2/filtered', activity),
    stubEndpoint('GET', '/schedules/2', activity.schedules[0]),
    stubEndpoint('PATCH', '/activities/MDI/activityId/2', activity),
  ])
}

export default stubEditTwoWeekActivity
