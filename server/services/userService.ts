import { convertToTitleCase } from '../utils/utils'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { ServiceUser } from '../@types/express'
import PrisonApiClient from '../data/prisonApiClient'
import AuthSource from '../enum/authSource'

export default class UserService {
  constructor(private readonly hmppsAuthClient: HmppsAuthClient, private readonly prisonApiClient: PrisonApiClient) {}

  async getUser(user: ServiceUser): Promise<ServiceUser> {
    const [hmppsAuthUser, nomisUser, userCaseLoads] = await Promise.all([
      this.hmppsAuthClient.getUser(user),
      user.authSource === AuthSource.NOMIS ? this.prisonApiClient.getUser(user) : null,
      user.authSource === AuthSource.NOMIS ? this.prisonApiClient.getUserCaseLoads(user) : null,
    ])

    return {
      ...user,
      ...hmppsAuthUser,
      ...nomisUser,
      displayName: convertToTitleCase(hmppsAuthUser.name),
      allCaseLoads: userCaseLoads,
      activeCaseLoad: userCaseLoads?.find(c => c.currentlyActive),
    }
  }

  async setActiveCaseLoad(caseLoadId: string, user: ServiceUser): Promise<void> {
    await this.prisonApiClient.setActiveCaseLoad(caseLoadId, user)
  }
}
