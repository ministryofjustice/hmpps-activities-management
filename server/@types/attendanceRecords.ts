import { Attendance, ScheduledActivity } from './activitiesAPI/types'
import { ScheduledEvent } from './activitiesAPI/types'

/**
 * Single prisoner with their activity instances and attendance records
 */

export interface PrisonerWithAttendanceRecord {
  /** Prisoner information */
  prisoner: {
    prisonerNumber: string
    firstName: string
    lastName: string
    cellLocation?: string
    status?: string
    prisonId?: string
  }

  /** List of scheduled activity instances for this prisoner */
  instances: ScheduledActivity[]

  /** IDs of the scheduled activity instances */
  instanceIds: number[]

  /** Attendance records for prisoner */
  attendances: Attendance[]

  /** IDs of the attendance records */
  attendanceIds: number[]

  /** Advance attendance records (future attendances) */
  advancedAttendances: Array<Attendance>

  /** Whether this prisoner has selectable attendance records */
  someSelectable: boolean

  /** Clashing events */
  otherEventsPerInstance: Array<Array<ScheduledEvent>>
}

/**
 * Array of prisoners with attendance records for location
 */
export type AttendanceRecordList = PrisonerWithAttendanceRecord[]

