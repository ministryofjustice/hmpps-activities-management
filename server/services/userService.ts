import { convertToTitleCase } from '../utils/utils'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { ServiceUser } from '../@types/express'
import PrisonApiClient from '../data/prisonApiClient'
import AuthSource from '../enum/authSource'
import NomisUserApiClient from '../data/nomisUserApiClient'
import { RolloutPrisonPlan } from '../@types/activitiesAPI/types'
import ActivitiesApiClient from '../data/activitiesApiClient'

export default class UserService {
  constructor(
    private readonly hmppsAuthClient: HmppsAuthClient,
    private readonly nomisUserRolesApiClient: NomisUserApiClient,
    private readonly prisonApiClient: PrisonApiClient,
    private readonly activitiesApiClient: ActivitiesApiClient,
  ) {}

  async getUser(user: ServiceUser): Promise<ServiceUser> {
    const [hmppsAuthUser, userRoles, nomisUser, userCaseLoads] = await Promise.all([
      this.hmppsAuthClient.getUser(user),
      user.authSource === AuthSource.NOMIS ? this.nomisUserRolesApiClient.getUserRoles(user) : null,
      user.authSource === AuthSource.NOMIS ? this.prisonApiClient.getUser(user) : null,
      user.authSource === AuthSource.NOMIS ? this.prisonApiClient.getUserCaseLoads(user) : null,
    ])

    const activeCaseLoad = userCaseLoads?.find(c => c.currentlyActive)
    const rolesInActiveCaseLoad = userRoles?.nomisRoles.find(r => r.caseload.id === activeCaseLoad?.caseLoadId)?.roles

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
      roles: [userRoles?.dpsRoles, rolesInActiveCaseLoad].flat(),
      isActivitiesRolledOut: currentRolloutPlan?.activitiesRolledOut || false,
      isAppointmentsRolledOut: currentRolloutPlan?.appointmentsRolledOut || false,
    }
  }

  async setActiveCaseLoad(caseLoadId: string, user: ServiceUser): Promise<void> {
    await this.prisonApiClient.setActiveCaseLoad(caseLoadId, user)
  }
}
