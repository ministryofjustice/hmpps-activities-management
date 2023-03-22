import { ActivityScheduleSlot } from '../../@types/activitiesAPI/types'

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default (slots: ActivityScheduleSlot[]) =>
  daysOfWeek
    .map(v => ({
      day: v,
      slots: slots
        .map(slot => {
          if (!slot.daysOfWeek.includes(v.substring(0, 3))) return null
          return {
            id: slot.id,
            startTime: slot.startTime,
            endTime: slot.endTime,
          }
        })
        .filter(Boolean),
    }))
    .filter(d => d.slots.length)
