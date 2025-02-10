import { addWeeks, format } from 'date-fns'
import getActivity from '../../../fixtures/activitiesApi/getActivity.json'
import getMathsActivity from '../../../fixtures/activitiesApi/getActivityMaths.json'
import getSchedule from '../../../fixtures/activitiesApi/getSchedule.json'
import getMathsSchedule from '../../../fixtures/activitiesApi/getScheduleMaths.json'

/* eslint no-return-assign: "off" */
/* eslint no-param-reassign: "off" */

export function resetActivitiesStub(activityStartDate: Date, startTime: string = '10:00', subject = 'english') {
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

  const activityNumber = subject === 'maths' ? 1 : 2
  cy.stubEndpoint('GET', `/activities/${activityNumber}/filtered`, newActivity)
}

export function resetScheduleStub(activityStartDate: Date, startTime: string = '10:00', subject = 'english') {
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

  const number = subject === 'maths' ? 1 : 2
  cy.stubEndpoint('GET', `/schedules/${number}`, newSchedule)
}

export default function resetActivityAndScheduleStubs(
  activityStartDate: Date,
  subject: string = 'english',
  startTime: string = '10:00',
) {
  resetActivitiesStub(activityStartDate, startTime, subject)
  resetScheduleStub(activityStartDate, startTime, subject)
}
