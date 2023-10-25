import { ScheduledActivity } from '../../../@types/activitiesAPI/types'

export type NotAttendedJourney = {
  activityInstance: ScheduledActivity
  selectedPrisoners?: Array<{
    attendanceId?: number
    prisonerNumber?: string
    prisonerName?: string
    otherEvents: {
      internalLocationDescription?: string
      summary?: string
    }[]
  }>
}
