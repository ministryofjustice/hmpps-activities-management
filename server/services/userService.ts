import { convertToTitleCase } from '../utils/utils'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { ServiceUser } from '../@types/express'
import PrisonApiClient from '../data/prisonApiClient'

export default class UserService {
  constructor(private readonly hmppsAuthClient: HmppsAuthClient, private readonly prisonApiClient: PrisonApiClient) {}

  async getUser(user: ServiceUser): Promise<ServiceUser> {
    const [hmppsAuthUser, nomisUser] = await Promise.all([
      this.hmppsAuthClient.getUser(user),
      user.authSource === 'nomis' ? this.prisonApiClient.getUser(user) : null,
    ])

    return { ...user, ...hmppsAuthUser, ...nomisUser, displayName: convertToTitleCase(hmppsAuthUser.name) }
  }
}
