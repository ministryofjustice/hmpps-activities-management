import { format } from 'date-fns'
import ActivitiesApiClient from '../data/activitiesApiClient'
import PrisonerSearchApiClient from '../data/prisonerSearchApiClient'
import { ServiceUser } from '../@types/express'
import {
  ActivityCategory,
  ActivityLite,
  ActivityScheduleLite,
  AttendanceUpdateRequest,
  InternalLocation,
  RolloutPrison,
  ScheduledEvent,
  LocationGroup,
  Allocation,
  ActivitySchedule,
} from '../@types/activitiesAPI/types'
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

  async getActivityCategories(user: ServiceUser): Promise<ActivityCategory[]> {
    return this.activitiesApiClient.getActivityCategories(user)
  }

  async getActivitiesInCategory(categoryId: number, user: ServiceUser): Promise<ActivityLite[]> {
    return this.activitiesApiClient.getActivitiesInCategory(user.activeCaseLoadId, categoryId, user)
  }

  async getSchedulesOfActivity(activityId: number, user: ServiceUser): Promise<ActivityScheduleLite[]> {
    return this.activitiesApiClient.getSchedulesOfActivity(activityId, user)
  }

  getScheduledEvents(
    prisonerNumber: string,
    startDate: Date,
    endDate: Date,
    user: ServiceUser,
  ): Promise<ScheduledEvent[]> {
    return this.activitiesApiClient
      .getScheduledEvents(
        user.activeCaseLoadId,
        prisonerNumber,
        format(startDate, 'yyyy-MM-dd'),
        format(endDate, 'yyyy-MM-dd'),
        user,
      )
      .then(res => [...res.activities, ...res.courtHearings, ...res.appointments, ...res.visits])
  }

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

    // We'd like to assume there would be only one activity schedule returned - but we cant at this stage
    const prisonerNumbers: string[] = activitySchedules
      .map(as => {
        if (as.instances.length === 1) {
          // We wouldn't be able to cope with multiple instances
          return as.allocations.map(alloc => alloc.prisonerNumber)
        }
        return []
      })
      .flat()

    const prisoners = await this.prisonerSearchApiClient.searchByPrisonerNumbers({ prisonerNumbers }, user)

    return activitySchedules
      .map(as => {
        if (as.instances.length === 1) {
          // We wouldn't be able to cope with multiple instances
          return as.allocations.map(alloc => {
            return {
              activityScheduleId: as.id,
              description: as.description,
              startTime: as.startTime,
              endTime: as.endTime,
              internalLocation: as.internalLocation,
              prisoner: prisoners.find(p => p.prisonerNumber === alloc.prisonerNumber),
              attendance: as.instances[0].attendances.find(a => a.prisonerNumber === alloc.prisonerNumber),
            }
          })
        }
        return []
      })
      .flat()
  }

  async updateAttendances(attendanceUpdates: AttendanceUpdateRequest[], user: ServiceUser): Promise<void> {
    return this.activitiesApiClient.updateAttendances(attendanceUpdates, user)
  }

  async getLocationGroups(prisonCode: string, user: ServiceUser): Promise<LocationGroup[]> {
    return this.activitiesApiClient.getPrisonLocationGroups(prisonCode, user)
  }

  async getAllocations(id: number, user: ServiceUser): Promise<Allocation[]> {
    return this.activitiesApiClient.getAllocations(id, user)
  }

  async getSchedule(id: number, user: ServiceUser): Promise<ActivitySchedule> {
    return this.activitiesApiClient.getSchedule(id, user)
  }
}
