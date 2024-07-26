import _ from 'lodash'
import { format } from 'date-fns'
import { ActivitySchedule, ScheduledInstance } from '../../@types/activitiesAPI/types'

export default function findNextSchedulesInstance(
  schedule: ActivitySchedule,
  startDateTime: Date = new Date(),
): ScheduledInstance {
  const nowStr = format(startDateTime, 'yyyy-MM-dd HH:mm')

  return _.first(
    schedule.instances
      .map(i => {
        return {
          ...i,
          startDateTime: `${i.date} ${i.startTime}`,
        }
      })
      .filter(i => i.startDateTime.localeCompare(nowStr) >= 0)
      .sort((a, b) => a.startDateTime.localeCompare(b.startDateTime)),
  )
}
