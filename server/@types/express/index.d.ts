import { HmppsAuthUser } from '../hmppsAuth'
import { PrisonApiUserDetail } from '../prisonApiImport/types'
import { CaseLoadExtended } from '../dps'
import { RoleDetail } from '../nomisUserApiImport/types'
import { AllocateToActivityJourney } from '../../routes/allocate-to-activity/journey'
import { CreateAnActivityJourney } from '../../routes/create-an-activity/journey'
import { CreateScheduleJourney } from '../../routes/manage-schedules/create-schedule/journey'
import { CreateSingleAppointmentJourney } from '../../routes/appointments/create-single/journey'
import { CalendarSpikeJourney } from '../../routes/spikes/handlers/journey'
import { RecordAttendanceRequests } from '../../routes/record-attendance/recordAttendanceRequests'

// eslint-disable-next-line import/no-cycle
import { UnlockFilters } from '../activities'

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
    createScheduleJourney: CreateScheduleJourney
    createSingleAppointmentJourney: CreateSingleAppointmentJourney
    calendarSpikeJourney: CalendarSpikeJourney
    unlockFilters: UnlockFilters
    recordAttendanceRequests: RecordAttendanceRequests
  }
}

declare module 'express-serve-static-core' {
  interface Response {
    redirectOrReturn?(path: string, returnTo?: string, flag?: string): void
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
    }
  }
}

export type ServiceUser = Express.User &
  HmppsAuthUser &
  PrisonApiUserDetail & {
    displayName: string
    allCaseLoads: CaseLoadExtended[]
    activeCaseLoad?: CaseLoadExtended
    roles: RoleDetail[]
  }
