import { jwtDecode } from 'jwt-decode'
import { convertToTitleCase } from '../utils/utils'
import ManageUsersApiClient from '../data/manageUsersApiClient'
import { ServiceUser } from '../@types/express'
import ActivitiesApiClient from '../data/activitiesApiClient'
import PrisonRegisterApiClient from '../data/prisonRegisterApiClient'
import { RolloutPrisonPlan } from '../@types/activitiesAPI/types'
import { Prison } from '../@types/prisonRegisterApiImport/types'
import { UserDetails } from '../@types/manageUsersApiImport/types'

export default class UserService {
  constructor(
    private readonly manageUsersApiClient: ManageUsersApiClient,
    private readonly prisonRegisterApiClient: PrisonRegisterApiClient,
    private readonly activitiesApiClient: ActivitiesApiClient,
  ) {}

  async getUser(user: Express.User, userInSession: ServiceUser): Promise<ServiceUser> {
    const userDetails = await this.manageUsersApiClient.getUser(user)
    const { authorities: roles = [] } = jwtDecode(user.token) as { authorities?: string[] }

    const updatedActiveCaseLoadInformation =
      userDetails.activeCaseLoadId !== userInSession?.activeCaseLoadId
        ? await this.fetchActiveCaseLoadInformation(userDetails)
        : undefined

    return {
      ...userInSession,
      ...user,
      ...userDetails,
      ...updatedActiveCaseLoadInformation,
      roles,
      displayName: convertToTitleCase(userDetails.name),
    }
  }

  private fetchActiveCaseLoadInformation = async (user: UserDetails) => {
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
