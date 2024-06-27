import { ActivitySchedule, ActivityScheduleLite } from '../@types/activitiesAPI/types'

export default function activityLocationDescription(schedule: ActivitySchedule | ActivityScheduleLite) {
  return getActivityLocationDescription(schedule.activity.inCell, schedule.activity.onWing, schedule.activity.offWing, schedule?.internalLocation?.description)
}

export function getActivityLocationDescription(inCell: Boolean, onWing: Boolean, offWing: Boolean, internalLocation?: String) {
  if (inCell) return 'In cell'
  if (onWing) return 'On wing'
  if (offWing) return 'Off wing'
  if (internalLocation) return internalLocation
  return 'None set'
}

