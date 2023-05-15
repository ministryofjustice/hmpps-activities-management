import { HmppsAuthUser } from '../hmppsAuth'
import { CaseLoad, PrisonApiUserDetail } from '../prisonApiImport/types'
import { RoleDetail } from '../nomisUserApiImport/types'
import { AllocateToActivityJourney } from '../../routes/allocate-to-activity/journey'
import { CreateAnActivityJourney } from '../../routes/create-an-activity/journey'
import { AppointmentJourney } from '../../routes/appointments/create-and-edit/appointmentJourney'
import { EditAppointmentJourney } from '../../routes/appointments/create-and-edit/editAppointmentJourney'
import { CalendarSpikeJourney } from '../../routes/spikes/handlers/journey'
import { NotAttendedJourney } from '../../routes/record-attendance/journey'
import { RecordAttendanceRequests } from '../../routes/record-attendance/recordAttendanceRequests'

// eslint-disable-next-line import/no-cycle
import { ActivitiesFilters, AttendanceSummaryFilters, UnlockFilters } from '../activities'
import { AppointmentDetails, AppointmentOccurrenceDetails } from '../activitiesAPI/types'
import { BulkAppointmentJourney } from '../../routes/appointments/create-and-edit/bulkAppointmentJourney'
import { DeallocateFromActivityJourney } from '../../routes/deallocate-from-activity/journey'

export default {}

declare module 'express-session' {
  // Declare that the session will potentially contain these additional fields
  interface SessionData {
    returnTo: string
    nowInMinutes: number
    user: ServiceUser
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    data: any
    createJourney: CreateAnActivityJourney
    allocateJourney: AllocateToActivityJourney
    deallocateJourney: DeallocateFromActivityJourney
    appointmentJourney: AppointmentJourney
    editAppointmentJourney: EditAppointmentJourney
    bulkAppointmentJourney: BulkAppointmentJourney
    calendarSpikeJourney: CalendarSpikeJourney
    unlockFilters: UnlockFilters
    activitiesFilters: ActivitiesFilters
    attendanceSummaryFilters: AttendanceSummaryFilters
    notAttendedJourney: NotAttendedJourney
    recordAttendanceRequests: RecordAttendanceRequests
  }
}

declare module 'express-serve-static-core' {
  interface Response {
    redirectWithSuccess?(path: string, successHeading: string, message?: string): void
    redirectOrReturnWithSuccess?(path: string, successHeading: string, message?: string): void
    redirectOrReturn?(path: string): void
    addValidationError?(field: string, message: string): void
    validationFailed?(field?: string, message?: string): void
  }
}

export declare global {
  namespace Express {
    interface User {
      username: string
      token: string
      authSource: string
    }

    interface Request {
      verified?: boolean
      id: string
      logout(done: (err: unknown) => void): void
      appointment?: AppointmentDetails
      appointmentOccurrence?: AppointmentOccurrenceDetails
    }
  }
}

export type ServiceUser = Express.User &
  HmppsAuthUser &
  PrisonApiUserDetail & {
    displayName: string
    allCaseLoads: CaseLoad[]
    activeCaseLoad?: CaseLoad
    isActivitiesRolledOut: boolean
    isAppointmentsRolledOut: boolean
    roles: RoleDetail[]
  }
