import { ActivitySchedule, ActivityScheduleLite } from '../@types/activitiesAPI/types'

export default function activityLocationDescription(schedule: ActivitySchedule | ActivityScheduleLite) {
  if (schedule?.internalLocation) return schedule?.internalLocation?.description
  if (schedule.activity.inCell) return 'In cell'
  if (schedule.activity.onWing) return 'On wing'
  if (schedule.activity.offWing) return 'Off wing'
  return 'None set'
}
