import { HmppsAuthUser } from '../hmppsAuth'
import { CaseLoad, PrisonApiUserDetail } from '../prisonApiImport/types'
import { AllocateToActivityJourney } from '../../routes/activities/allocate-to-activity/journey'
import { CreateAnActivityJourney } from '../../routes/activities/create-an-activity/journey'
import { AppointmentJourney } from '../../routes/appointments/create-and-edit/appointmentJourney'
import { EditAppointmentJourney } from '../../routes/appointments/create-and-edit/editAppointmentJourney'
import { CalendarSpikeJourney } from '../../routes/spikes/handlers/journey'
import { NotAttendedJourney } from '../../routes/activities/record-attendance/journey'
import { RecordAttendanceRequests } from '../../routes/activities/record-attendance/recordAttendanceRequests'

// eslint-disable-next-line import/no-cycle
import { ActivitiesFilters, AttendanceSummaryFilters, UnlockFilters } from '../activities'
import { AppointmentDetails, AppointmentOccurrenceDetails, BulkAppointmentDetails } from '../activitiesAPI/types'
import { BulkAppointmentJourney } from '../../routes/appointments/create-and-edit/bulkAppointmentJourney'
import { DeallocateFromActivityJourney } from '../../routes/activities/deallocate-from-activity/journey'

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
    // The following three session data properties; appointmentJourney, editAppointmentJourney and bulkAppointmentJourney
    // are overridden by the populateJourney middleware. That middleware redirects the getter and setter to use the
    // appointmentSessionDataMap below. As a result, these properties are virtual and are not directly set. They exist
    // to allow pre-existing access as if there was only one journey per session e.g. req.session.appointmentJourney
    appointmentJourney: AppointmentJourney
    // See comment above
    editAppointmentJourney: EditAppointmentJourney
    // See comment above
    bulkAppointmentJourney: BulkAppointmentJourney
    calendarSpikeJourney: CalendarSpikeJourney
    unlockFilters: UnlockFilters
    activitiesFilters: ActivitiesFilters
    attendanceSummaryFilters: AttendanceSummaryFilters
    notAttendedJourney: NotAttendedJourney
    recordAttendanceRequests: RecordAttendanceRequests
    // Map containing per journey session data. See comment above, the startNewJourney and populateJourney
    // middlewares and the appointment routes in index.ts
    appointmentSessionDataMap: Map<string, AppointmentSessionDatum>
  }
}

export type AppointmentSessionDatum = {
  appointmentJourney: AppointmentJourney
  bulkAppointmentJourney: BulkAppointmentJourney
  editAppointmentJourney: EditAppointmentJourney
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
      bulkAppointment?: BulkAppointmentDetails
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
    roles: string[]
  }
