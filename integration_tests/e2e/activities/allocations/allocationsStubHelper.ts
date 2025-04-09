import { addWeeks, format } from 'date-fns'
import getActivity from '../../../fixtures/activitiesApi/getActivity.json'
import getMathsActivity from '../../../fixtures/activitiesApi/getActivityMaths.json'
import getSchedule from '../../../fixtures/activitiesApi/getSchedule.json'
import getMathsSchedule from '../../../fixtures/activitiesApi/getScheduleMaths.json'

/* eslint no-return-assign: "off" */
/* eslint no-param-reassign: "off" */

const extraAllocations = [
  {
    id: 1,
    prisonerNumber: 'A1351DZ',
    bookingId: 1200993,
    activitySummary: 'English level 1',
    scheduleDescription: 'Entry level English 1',
    payBandId: 1,
    startDate: '2022-10-10',
    endDate: null,
    allocatedTime: '2022-10-10T09:30:00',
    allocatedBy: 'MR BLOGS',
    deallocatedTime: null,
    deallocatedBy: null,
    deallocatedReason: null,
    status: 'ACTIVE',
  },
  {
    id: 3,
    prisonerNumber: 'B1351RE',
    bookingId: 1200993,
    activitySummary: 'English level 1',
    scheduleDescription: 'Entry level English 1',
    payBandId: 1,
    startDate: '2022-10-10',
    endDate: null,
    allocatedTime: '2022-10-10T09:30:00',
    allocatedBy: 'MR BLOGS',
    deallocatedTime: null,
    deallocatedBy: null,
    deallocatedReason: null,
    status: 'ACTIVE',
  },
]

export function resetActivitiesStub({
  activityStartDate,
  startTime = '10:00',
  subject = 'english',
  reducedPayOptions = false,
  addExtraAllocations = false,
  paid = true,
}: {
  activityStartDate: Date
  startTime: string
  subject: string
  reducedPayOptions: boolean
  addExtraAllocations: boolean
  paid: boolean
}) {
  let currentDate = activityStartDate
  let newActivity
  if (subject === 'maths') {
    newActivity = { ...getMathsActivity }
  } else {
    newActivity = { ...getActivity }
  }

  const firstActivitySchedule = newActivity.schedules[0]
  firstActivitySchedule.startDate = currentDate

  firstActivitySchedule.allocations.forEach((allocation: { startDate: Date }) => (allocation.startDate = currentDate))
  firstActivitySchedule.instances.forEach((instance: { date: string }) => {
    instance.date = format(currentDate, 'yyyy-MM-dd')
    currentDate = addWeeks(currentDate, 1)
  })

  newActivity.schedules[0].instances[2].startTime = startTime
  newActivity.schedules[0].instances[0].startTime = startTime

  if (reducedPayOptions && paid) {
    const reducedPayRatesList = newActivity.pay.slice(0, 4)
    newActivity.pay = reducedPayRatesList
  }

  if (!paid) {
    newActivity.paid = false
    newActivity.pay = []
  }

  if (addExtraAllocations) {
    firstActivitySchedule.allocations.push(...extraAllocations)
  }

  const activityNumber = getActivityNumber(subject)
  cy.stubEndpoint('GET', `/activities/${activityNumber}/filtered`, newActivity)
}

export function resetScheduleStub({
  activityStartDate,
  startTime = '10:00',
  subject = 'english',
}: {
  activityStartDate: Date
  startTime: string
  subject: string
}) {
  let currentDate = activityStartDate
  let newSchedule
  if (subject === 'maths') {
    newSchedule = { ...getMathsSchedule }
  } else {
    newSchedule = { ...getSchedule }
  }

  newSchedule.instances.forEach((instance: { date: string }) => {
    instance.date = format(currentDate, 'yyyy-MM-dd')
    currentDate = addWeeks(currentDate, 1)
  })

  newSchedule.instances[2].startTime = startTime
  newSchedule.instances[0].startTime = startTime

  const number = getActivityNumber(subject)
  cy.stubEndpoint('GET', `/schedules/${number}`, newSchedule)
}

export default function resetActivityAndScheduleStubs({
  activityStartDate,
  startTime = '10:00',
  subject = 'english',
  reducedPayOptions = false,
  addExtraAllocations = false,
  paid = true,
}: {
  activityStartDate: Date
  startTime?: string
  subject?: string
  reducedPayOptions?: boolean
  addExtraAllocations?: boolean
  paid?: boolean
}) {
  resetActivitiesStub({ activityStartDate, startTime, subject, reducedPayOptions, addExtraAllocations, paid })
  resetScheduleStub({ activityStartDate, startTime, subject })
}

const getActivityNumber = activitySubject => {
  switch (activitySubject) {
    case 'maths':
      return 1
    case 'science':
      return 3
    default:
      return 2
  }
}
