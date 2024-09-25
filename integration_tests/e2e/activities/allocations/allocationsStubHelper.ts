import { addWeeks, format } from 'date-fns'
import getActivity from '../../../fixtures/activitiesApi/getActivity.json'
import getSchedule from '../../../fixtures/activitiesApi/getSchedule.json'

/* eslint no-return-assign: "error" */
/* eslint no-param-reassign: "error" */

export function resetActivitiesStub(activityStartDate: Date, startTime: string = '10:00') {
  let currentDate = activityStartDate
  const newActivity = { ...getActivity }

  const firstActivitySchedule = newActivity.schedules[0]
  firstActivitySchedule.startDate = currentDate

  firstActivitySchedule.allocations.forEach((allocation: { startDate: Date }) => (allocation.startDate = currentDate))
  firstActivitySchedule.instances.forEach((instance: { date: string }) => {
    instance.date = format(currentDate, 'yyyy-MM-dd')
    currentDate = addWeeks(currentDate, 1)
  })

  newActivity.schedules[0].instances[2].startTime = startTime

  cy.stubEndpoint('GET', '/activities/2/filtered', newActivity)
}

export function resetScheduleStub(activityStartDate: Date, startTime: string = '10:00') {
  let currentDate = activityStartDate
  const newSchedule = { ...getSchedule }

  newSchedule.instances.forEach((instance: { date: string }) => {
    instance.date = format(currentDate, 'yyyy-MM-dd')
    currentDate = addWeeks(currentDate, 1)
  })

  newSchedule.instances[2].startTime = startTime

  cy.stubEndpoint('GET', '/schedules/2', newSchedule)
}

export default function resetActivityAndScheduleStubs(activityStartDate: Date, startTime: string = '10:00') {
  resetActivitiesStub(activityStartDate, startTime)
  resetScheduleStub(activityStartDate, startTime)
}
