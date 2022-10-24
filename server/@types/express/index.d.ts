import { HmppsAuthUser } from '../hmppsAuth'
import { PrisonApiUserDetail } from '../prisonApiImport/types'
import { CaseLoadExtended } from '../dps'
import { RoleDetail } from '../nomisUserApiImport/types'

export default {}

declare module 'express-session' {
  // Declare that the session will potentially contain these additional fields
  interface SessionData {
    returnTo: string
    nowInMinutes: number
    user: ServiceUser
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    data: any
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
