import _ from 'lodash'
import { PrisonerScheduledEvents, ScheduledActivity } from '../../../../@types/activitiesAPI/types'

export const flattenPrisonerScheduledEvents = (scheduledEvents: PrisonerScheduledEvents) => [
  ...scheduledEvents.activities,
  ...scheduledEvents.appointments,
  ...scheduledEvents.courtHearings,
  ...scheduledEvents.visits,
  ...scheduledEvents.adjudications,
]

export const getPrisonerNumbersFromScheduledActivities = (activities: ScheduledActivity[]) =>
  _.uniq(activities.flatMap(instance => instance.attendances.map(att => att.prisonerNumber)))
