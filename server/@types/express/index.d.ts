import { HmppsAuthUser } from '../hmppsAuth'
import { CaseLoad, PrisonApiUserDetail } from '../prisonApiImport/types'
import { AllocateToActivityJourney } from '../../routes/activities/allocate-to-activity/journey'
import { CreateAnActivityJourney } from '../../routes/activities/create-an-activity/journey'
import { AppointmentJourney } from '../../routes/appointments/create-and-edit/appointmentJourney'
import { EditAppointmentJourney } from '../../routes/appointments/create-and-edit/editAppointmentJourney'
import { CalendarSpikeJourney } from '../../routes/spikes/handlers/journey'
import { NotAttendedJourney } from '../../routes/activities/record-attendance/journey'
import { RecordAttendanceRequests } from '../../routes/activities/record-attendance/recordAttendanceRequests'
import { JourneyMetrics } from '../../routes/journeyMetrics'

// eslint-disable-next-line import/no-cycle
import { AppointmentSeriesDetails, AppointmentDetails, AppointmentSetDetails } from '../activitiesAPI/types'
import { AppointmentSetJourney } from '../../routes/appointments/create-and-edit/appointmentSetJourney'
import { DeallocateFromActivityJourney } from '../../routes/activities/deallocate-from-activity/journey'
import { AttendanceSummaryJourney } from '../../routes/activities/daily-attendance-summary/journey'
import { UnlockListJourney } from '../../routes/activities/unlock-list/journey'
import { WaitListApplicationJourney } from '../../routes/activities/waitlist-application/journey'

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
    // The following three session data properties; appointmentJourney, appointmentSetJourney and editAppointmentJourney
    // are overridden by the populateJourney middleware. That middleware redirects the getter and setter to use the
    // sessionDataMap below. As a result, these properties are virtual and are not directly set. They exist
    // to allow pre-existing access as if there was only one journey per session e.g. req.session.appointmentJourney
    appointmentJourney: AppointmentJourney
    // See comment above
    appointmentSetJourney: AppointmentSetJourney
    // See comment above
    editAppointmentJourney: EditAppointmentJourney
    calendarSpikeJourney: CalendarSpikeJourney
    attendanceSummaryJourney: AttendanceSummaryJourney
    unlockListJourney: UnlockListJourney
    waitListApplicationJourney: WaitListApplicationJourney
    notAttendedJourney: NotAttendedJourney
    recordAttendanceRequests: RecordAttendanceRequests
    journeyMetrics: JourneyMetrics
    // Map containing per journey session data. See comment above, the startNewJourney and populateJourney
    // middlewares and the appointment routes in index.ts
    sessionDataMap: Map<string, SessionDatum>
  }
}

export type SessionDatum = {
  instanceUnixEpoch: number
  appointmentJourney: AppointmentJourney
  appointmentSetJourney: AppointmentSetJourney
  editAppointmentJourney: EditAppointmentJourney
  journeyMetrics: JourneyMetrics
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
      appointmentSeries?: AppointmentSeriesDetails
      appointment?: AppointmentDetails
      appointmentSet?: AppointmentSetDetails
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
