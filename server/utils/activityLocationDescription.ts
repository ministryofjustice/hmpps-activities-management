import { ActivitySchedule, ActivityScheduleLite } from '../@types/activitiesAPI/types'

export default function activityLocationDescription(schedule: ActivitySchedule | ActivityScheduleLite) {
  return getActivityLocationDescription(
    schedule.activity.inCell,
    schedule.activity.onWing,
    schedule.activity.offWing,
    schedule?.internalLocation?.description,
  )
}

export function getActivityLocationDescription(
  inCell: boolean,
  onWing: boolean,
  offWing: boolean,
  internalLocation?: string,
) {
  if (internalLocation) return internalLocation
  if (inCell) return 'In cell'
  if (onWing) return 'On wing'
  if (offWing) return 'Off wing'
  return 'None set'
}
