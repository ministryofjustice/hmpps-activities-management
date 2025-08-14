import { AllocateToActivityJourney } from '../../routes/activities/manage-allocations/journey'
import { CreateAnActivityJourney } from '../../routes/activities/create-an-activity/journey'
import { AppointmentJourney } from '../../routes/appointments/create-and-edit/appointmentJourney'
import { EditAppointmentJourney } from '../../routes/appointments/create-and-edit/editAppointmentJourney'
import { RecordAttendanceJourney } from '../../routes/activities/record-attendance/journey'
import { JourneyMetrics } from '../../routes/journeyMetrics'

import { AppointmentSeriesDetails, AppointmentDetails, AppointmentSetDetails } from '../activitiesAPI/types'
import { AppointmentSetJourney } from '../../routes/appointments/create-and-edit/appointmentSetJourney'
import { AttendanceSummaryJourney } from '../../routes/activities/daily-attendance-summary/journey'
import { UnlockListJourney } from '../../routes/activities/unlock-list/journey'
import { WaitListApplicationJourney } from '../../routes/activities/waitlist-application/journey'
import { PrisonerAllocationsJourney } from '../../routes/activities/prisoner-allocations/journey'
import { SuspendJourney } from '../../routes/activities/suspensions/journey'
import { UserDetails } from '../manageUsersApiImport/types'
import { MovementListJourney } from '../../routes/activities/movement-list/journey'
import { BookACourtHearingJourney } from '../../routes/appointments/video-link-booking/court/journey'
import { RecordAppointmentAttendanceJourney } from '../../routes/appointments/attendanceJourney'
import { BookAProbationMeetingJourney } from '../../routes/appointments/video-link-booking/probation/journey'

export default {}

declare module 'express-session' {
  // Declare that the session will potentially contain these additional fields
  interface SessionData {
    returnTo: string
    nowInMinutes: number
    user: ServiceUser
    // The following session data properties are overridden by the populateJourney middleware.
    // That middleware redirects the getter and setter to use the sessionDataMap below. As a result,
    // these properties are virtual and are not directly set. They exist to allow pre-existing access
    // as if there was only one journey per session e.g. req.session.appointmentJourney
    allocateJourney: AllocateToActivityJourney
    suspendJourney: SuspendJourney
    appointmentJourney: AppointmentJourney
    appointmentSetJourney: AppointmentSetJourney
    editAppointmentJourney: EditAppointmentJourney
    bookACourtHearingJourney: BookACourtHearingJourney
    bookAProbationMeetingJourney: BookAProbationMeetingJourney
    attendanceSummaryJourney: AttendanceSummaryJourney
    recordAppointmentAttendanceJourney: RecordAppointmentAttendanceJourney
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
      journeyData: JourneyData
      routeContext?: { mode?: string }
    }
  }
}

export type JourneyData = {
  createJourney?: CreateAnActivityJourney
  movementListJourney?: MovementListJourney
  waitListApplicationJourney?: WaitListApplicationJourney
  prisonerAllocationsJourney?: PrisonerAllocationsJourney
  unlockListJourney?: UnlockListJourney
  recordAttendanceJourney?: RecordAttendanceJourney
}

export type ServiceUser = Express.User &
  UserDetails & {
    displayName: string
    roles: string[]
    activeCaseLoadDescription: string
    isActivitiesRolledOut: boolean
    isAppointmentsRolledOut: boolean
  }
