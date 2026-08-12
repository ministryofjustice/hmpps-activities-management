import { addWeeks, format } from 'date-fns'

import getActivity from '../../../../integration_tests/fixtures/activitiesApi/getActivity.json'
import getMathsActivity from '../../../../integration_tests/fixtures/activitiesApi/getActivityMaths.json'
import getSchedule from '../../../../integration_tests/fixtures/activitiesApi/getSchedule.json'
import getMathsSchedule from '../../../../integration_tests/fixtures/activitiesApi/getScheduleMaths.json'
import { stubEndpoint } from '../../../../integration_tests/mockApis/wiremock'

type Subject = 'english' | 'maths' | 'science'

type StubActivityAndScheduleOptions = {
  activityStartDate: Date
  startTime?: string
  subject?: Subject
}

const getActivityNumber = (subject: Subject): number => {
  switch (subject) {
    case 'maths':
      return 1
    case 'science':
      return 3
    default:
      return 2
  }
}

const stubActivityAndSchedule = async ({
  activityStartDate,
  startTime = '10:00',
  subject = 'english',
}: StubActivityAndScheduleOptions): Promise<void> => {
  const activitySource = subject === 'maths' ? getMathsActivity : getActivity

  const activity = structuredClone(activitySource) as typeof getActivity

  const startDate = format(activityStartDate, 'yyyy-MM-dd')

  activity.schedules[0] = {
    ...activity.schedules[0],
    startDate,
    allocations: activity.schedules[0].allocations.map(allocation => ({
      ...allocation,
      startDate,
    })),
    instances: activity.schedules[0].instances.map((instance, index) => ({
      ...instance,
      date: format(addWeeks(activityStartDate, index), 'yyyy-MM-dd'),
      startTime: index === 0 || index === 2 ? startTime : instance.startTime,
    })),
  }

  const filteredActivity = structuredClone(activity)

  filteredActivity.schedules = filteredActivity.schedules.map(schedule => ({
    ...schedule,
    instances: [],
  }))

  const scheduleSource = subject === 'maths' ? getMathsSchedule : getSchedule

  const schedule = structuredClone(scheduleSource) as typeof getSchedule

  schedule.instances = schedule.instances.map((instance, index) => ({
    ...instance,
    date: format(addWeeks(activityStartDate, index), 'yyyy-MM-dd'),
    startTime: index === 0 || index === 2 ? startTime : instance.startTime,
  }))

  const activityNumber = getActivityNumber(subject)

  await stubEndpoint('GET', `/activities/${activityNumber}/filtered`, activity)

  await stubEndpoint(
    'GET',
    `/activities/${activityNumber}/filtered\\?includeScheduledInstances=false`,
    filteredActivity,
  )

  await stubEndpoint('GET', `/schedules/${activityNumber}`, schedule)
}

export default stubActivityAndSchedule
