import { ActivityScheduleSlot } from '../../@types/activitiesAPI/types'
import { getTimeSlotFromTime } from '../utils'

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default (slots: ActivityScheduleSlot[]) =>
  daysOfWeek.map(v => ({
    day: v,
    slots: slots
      .map(slot => {
        if (!slot.daysOfWeek.includes(v.substring(0, 3))) return null
        return getTimeSlotFromTime(slot.startTime)
      })
      .filter(Boolean),
  }))
