import jwtDecode from 'jwt-decode'
import { convertToTitleCase } from '../utils/utils'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { ServiceUser } from '../@types/express'
import PrisonApiClient from '../data/prisonApiClient'
import AuthSource from '../enum/authSource'
import { RolloutPrisonPlan } from '../@types/activitiesAPI/types'
import ActivitiesApiClient from '../data/activitiesApiClient'

export default class UserService {
  constructor(
    private readonly hmppsAuthClient: HmppsAuthClient,
    private readonly prisonApiClient: PrisonApiClient,
    private readonly activitiesApiClient: ActivitiesApiClient,
  ) {}

  async getUser(user: ServiceUser): Promise<ServiceUser> {
    const [hmppsAuthUser, nomisUser, userCaseLoads] = await Promise.all([
      this.hmppsAuthClient.getUser(user),
      user.authSource === AuthSource.NOMIS ? this.prisonApiClient.getUser(user) : null,
      user.authSource === AuthSource.NOMIS ? this.prisonApiClient.getUserCaseLoads(user) : null,
    ])

    const { authorities: roles = [] } = jwtDecode(user.token) as { authorities?: string[] }

    const activeCaseLoad = userCaseLoads?.find(c => c.currentlyActive)

    const rolloutPlans: RolloutPrisonPlan[] = await Promise.all(
      userCaseLoads?.map(cl => this.activitiesApiClient.getPrisonRolloutPlan(cl.caseLoadId)) || [],
    )

    const currentRolloutPlan = rolloutPlans.find(r => r.prisonCode === activeCaseLoad.caseLoadId)

    return {
      ...user,
      ...hmppsAuthUser,
      ...nomisUser,
      displayName: convertToTitleCase(hmppsAuthUser.name),
      allCaseLoads: userCaseLoads,
      activeCaseLoad,
      roles,
      isActivitiesRolledOut: currentRolloutPlan?.activitiesRolledOut || false,
      isAppointmentsRolledOut: currentRolloutPlan?.appointmentsRolledOut || false,
    }
  }

  async setActiveCaseLoad(caseLoadId: string, user: ServiceUser): Promise<void> {
    await this.prisonApiClient.setActiveCaseLoad(caseLoadId, user)
  }
}
