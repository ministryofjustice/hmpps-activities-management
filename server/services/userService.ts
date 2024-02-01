import { jwtDecode } from 'jwt-decode'
import { convertToTitleCase } from '../utils/utils'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { ServiceUser } from '../@types/express'
import ActivitiesApiClient from '../data/activitiesApiClient'
import PrisonRegisterApiClient from '../data/prisonRegisterApiClient'
import { RolloutPrisonPlan } from '../@types/activitiesAPI/types'
import { Prison } from '../@types/prisonRegisterApiImport/types'
import { HmppsAuthUser } from '../@types/hmppsAuth'

export default class UserService {
  constructor(
    private readonly hmppsAuthClient: HmppsAuthClient,
    private readonly prisonRegisterApiClient: PrisonRegisterApiClient,
    private readonly activitiesApiClient: ActivitiesApiClient,
  ) {}

  async getUser(user: Express.User, userInSession: ServiceUser): Promise<ServiceUser> {
    const hmppsAuthUser = await this.hmppsAuthClient.getUser(user)
    const { authorities: roles = [] } = jwtDecode(user.token) as { authorities?: string[] }

    const updatedActiveCaseLoadInformation =
      hmppsAuthUser.activeCaseLoadId !== userInSession?.activeCaseLoadId
        ? await this.fetchActiveCaseLoadInformation(hmppsAuthUser)
        : undefined

    return {
      ...userInSession,
      ...user,
      ...hmppsAuthUser,
      ...updatedActiveCaseLoadInformation,
      roles,
      displayName: convertToTitleCase(hmppsAuthUser.name),
    }
  }

  private fetchActiveCaseLoadInformation = async (user: HmppsAuthUser) => {
    const [rolloutPlan, activePrisonInformation]: [RolloutPrisonPlan, Prison] = await Promise.all([
      this.activitiesApiClient.getPrisonRolloutPlan(user.activeCaseLoadId),
      this.prisonRegisterApiClient.getPrisonInformation(user.activeCaseLoadId, user as ServiceUser),
    ])

    return {
      activeCaseLoadDescription: activePrisonInformation.prisonName,
      isActivitiesRolledOut: rolloutPlan.activitiesRolledOut,
      isAppointmentsRolledOut: rolloutPlan.appointmentsRolledOut,
    }
  }
}
