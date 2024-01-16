import { jwtDecode } from 'jwt-decode'
import { convertToTitleCase } from '../utils/utils'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { ServiceUser } from '../@types/express'
import PrisonApiClient from '../data/prisonApiClient'
import ActivitiesApiClient from '../data/activitiesApiClient'
import { HmppsAuthUser } from '../@types/hmppsAuth'
import { CaseLoad, PrisonApiUserDetail } from '../@types/prisonApiImport/types'

export default class UserService {
  constructor(
    private readonly hmppsAuthClient: HmppsAuthClient,
    private readonly prisonApiClient: PrisonApiClient,
    private readonly activitiesApiClient: ActivitiesApiClient,
  ) {}

  async getUser(user: ServiceUser): Promise<ServiceUser> {
    const [hmppsAuthUser, nomisUser, userCaseLoads]: [HmppsAuthUser, PrisonApiUserDetail, CaseLoad[]] =
      await Promise.all([
        this.hmppsAuthClient.getUser(user),
        this.prisonApiClient.getUser(user),
        this.prisonApiClient.getUserCaseLoads(user),
      ])

    const { authorities: roles = [] } = jwtDecode(user.token) as { authorities?: string[] }

    const activeCaseLoad = userCaseLoads?.find(c => c.currentlyActive)
    const rolloutPlan = await this.activitiesApiClient.getPrisonRolloutPlan(nomisUser.activeCaseLoadId)

    return {
      ...user,
      ...hmppsAuthUser,
      ...nomisUser,
      displayName: convertToTitleCase(hmppsAuthUser.name),
      allCaseLoads: userCaseLoads,
      activeCaseLoad,
      roles,
      isActivitiesRolledOut: rolloutPlan?.activitiesRolledOut || false,
      isAppointmentsRolledOut: rolloutPlan?.appointmentsRolledOut || false,
    }
  }
}
