import { convertToTitleCase } from '../utils/utils'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { ServiceUser } from '../@types/express'
import PrisonApiClient from '../data/prisonApiClient'
import AuthSource from '../enum/authSource'
import NomisUserApiClient from '../data/nomisUserApiClient'

export default class UserService {
  constructor(
    private readonly hmppsAuthClient: HmppsAuthClient,
    private readonly nomisUserRolesApiClient: NomisUserApiClient,
    private readonly prisonApiClient: PrisonApiClient,
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

    return {
      ...user,
      ...hmppsAuthUser,
      ...nomisUser,
      displayName: convertToTitleCase(hmppsAuthUser.name),
      allCaseLoads: userCaseLoads,
      activeCaseLoad,
      roles: [userRoles?.dpsRoles, rolesInActiveCaseLoad].flat(),
    }
  }

  async setActiveCaseLoad(caseLoadId: string, user: ServiceUser): Promise<void> {
    await this.prisonApiClient.setActiveCaseLoad(caseLoadId, user)
  }
}
