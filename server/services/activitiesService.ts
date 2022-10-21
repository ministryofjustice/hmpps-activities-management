import ActivitiesApiClient from '../data/activitiesApiClient'
import PrisonerSearchApiClient from '../data/prisonerSearchApiClient'
import { ServiceUser } from '../@types/express'
import { InternalLocation, RolloutPrison } from '../@types/activitiesAPI/types'
import { SanitisedError } from '../sanitisedError'
import { CaseLoadExtended } from '../@types/dps'
import { ActivityScheduleAllocation } from '../@types/activities'

const processError = (error: SanitisedError): undefined => {
  if (!error.status) throw error
  if (error.status !== 404) throw error // Not Found
  return undefined
}

export default class ActivitiesService {
  constructor(
    private readonly activitiesApiClient: ActivitiesApiClient,
    private readonly prisonerSearchApiClient: PrisonerSearchApiClient,
  ) {}

  async populateUserPrisonInfo(user: ServiceUser) {
    const prisonInfoCalls: Promise<RolloutPrison | undefined>[] = []
    user.allCaseLoads.forEach(cl => {
      prisonInfoCalls.push(this.getPrison(cl.caseLoadId, user))
    })
    const responses: RolloutPrison[] = await Promise.all(prisonInfoCalls)
    const results = responses.filter(elem => elem !== undefined)
    const userCaseLoads: CaseLoadExtended[] = []
    const newUser = { ...user }
    user.allCaseLoads.forEach(cl => {
      const match = results.find(r => r.code === cl.caseLoadId)
      if (match) {
        const cle = cl as CaseLoadExtended
        cle.isRolledOut = match.active
        userCaseLoads.push(cle)
        if (cle.caseLoadId === user.activeCaseLoadId) {
          newUser.activeCaseLoad = cle
        }
      } else {
        userCaseLoads.push(cl)
      }
    })
    newUser.allCaseLoads = userCaseLoads
    return newUser
  }

  async getPrison(prisonCode: string, user: ServiceUser): Promise<RolloutPrison | undefined> {
    return this.activitiesApiClient.getRolloutPrison(prisonCode, user).catch(processError)
  }

  async getScheduledPrisonLocations(
    prisonCode: string,
    date: string,
    period: string,
    user: ServiceUser,
  ): Promise<InternalLocation[]> {
    return this.activitiesApiClient.getScheduledPrisonLocations(prisonCode, date, period, user)
  }

  async getActivitySchedules(
    prisonCode: string,
    locationId: string,
    date: string,
    period: string,
    user: ServiceUser,
  ): Promise<ActivityScheduleAllocation[]> {
    const activitySchedules = await this.activitiesApiClient.getActivitySchedules(
      prisonCode,
      locationId,
      date,
      period,
      user,
    )
    const prisonerNumbers: string[] = activitySchedules
      .map(as => {
        return as.allocations.map(alloc => alloc.prisonerNumber)
      })
      .flat()

    if (prisonerNumbers.length === 0) {
      return []
    }
    const prisoners = await this.prisonerSearchApiClient.searchByPrisonerNumbers({ prisonerNumbers }, user)
    return activitySchedules
      .map(as => {
        return as.allocations.map(alloc => {
          return {
            activityScheduleId: as.id,
            description: as.description,
            startTime: as.startTime,
            endTime: as.endTime,
            internalLocation: as.internalLocation,
            prisoner: prisoners.find(p => p.prisonerNumber === alloc.prisonerNumber),
          }
        })
      })
      .flat()
  }
}
