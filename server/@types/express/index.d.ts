import { HmppsAuthUser } from '../hmppsAuth'
import { PrisonApiUserDetail } from '../prisonApiImport/types'
import { CaseLoadExtended } from '../dps'
import { RoleDetail } from '../nomisUserApiImport/types'
import { AllocateToActivityJourney } from '../../routes/allocate-to-activity/journey'
import { CreateAnActivityJourney } from '../../routes/create-an-activity/journey'

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
