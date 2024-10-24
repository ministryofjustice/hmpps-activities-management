import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import { Activity, NonAssociationDetails, PrisonerAllocations } from '../../../../@types/activitiesAPI/types'
import { Prisoner } from '../../../../@types/activities'
import PrisonService from '../../../../services/prisonService'
import { getScheduleIdFromActivity } from '../../../../utils/utils'
import { ServiceUser } from '../../../../@types/express'

export default class NonAssociationsRoutes {
  constructor(
    private readonly prisonService: PrisonService,
    private readonly activitiesService: ActivitiesService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { activityId, prisonerNumber } = req.params

    const [activity, prisoner]: [Activity, Prisoner] = await Promise.all([
      this.activitiesService.getActivity(+activityId, user),
      this.prisonService.getInmateByPrisonerNumber(prisonerNumber, user),
    ])

    const scheduleId = getScheduleIdFromActivity(activity)
    const nonAssociations = await this.activitiesService.getNonAssociations(scheduleId, prisonerNumber, user)
    const nonAssociationPrns = nonAssociations.map(na => na.otherPrisonerDetails.prisonerNumber)
    const prisonerAllocations = await this.activitiesService.getActivePrisonPrisonerAllocations(
      nonAssociationPrns,
      user,
    )
    const enhancedNonAssociations = await this.enhanceNonAssociations(nonAssociations, prisonerAllocations, user)

    res.render('pages/activities/non-associations/nonAssociations', {
      activity,
      prisoner,
      allocatedNonAssociations: enhancedNonAssociations.filter(na => na.allocated === true),
      unallocatedNonAssociations: enhancedNonAssociations.filter(na => na.allocated === false),
    })
  }

  private enhanceNonAssociations = async (
    nonAssociations: NonAssociationDetails[],
    prisonerAllocations: PrisonerAllocations[],
    user: ServiceUser,
  ) => {
    const updatedPrisonerAllocations = await Promise.all(
      prisonerAllocations.map(async prisoner => {
        const updatedAllocations = await Promise.all(
          prisoner.allocations.map(async allocation => {
            const activity = await this.activitiesService.getActivity(allocation.activityId, user)

            return {
              ...allocation,
              schedule: activity.schedules[0],
            }
          }),
        )

        return {
          ...prisoner,
          allocations: updatedAllocations,
        }
      }),
    )
    const naAllocations = new Map(updatedPrisonerAllocations.map(naAll => [naAll.prisonerNumber, naAll.allocations]))
    return nonAssociations.map(na => {
      return {
        ...na,
        allocations: naAllocations.get(na.otherPrisonerDetails.prisonerNumber) || [],
      }
    })
  }
}
