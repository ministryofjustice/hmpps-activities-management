import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import { Activity, NonAssociationDetails, PrisonerAllocations } from '../../../../@types/activitiesAPI/types'
import { Prisoner } from '../../../../@types/activities'
import PrisonService from '../../../../services/prisonService'
import { getScheduleIdFromActivity } from '../../../../utils/utils'

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
    const enhancedNonAssociations = await this.enhanceNonAssociations(nonAssociations, prisonerAllocations)

    res.render('pages/activities/non-associations/nonAssociations', {
      activity,
      prisoner,
      allocatedNonAssociations: enhancedNonAssociations.filter(na => na.allocated === true),
      unallocatedNonAssociations: enhancedNonAssociations.filter(na => na.allocated === false),
    })
  }

  private enhanceNonAssociations = (
    nonAssociations: NonAssociationDetails[],
    prisonerAllocations: PrisonerAllocations[],
  ) => {
    const naAllocations = new Map(prisonerAllocations.map(naAll => [naAll.prisonerNumber, naAll.allocations]))

    return nonAssociations.map(na => {
      return {
        ...na,
        allocations: naAllocations.get(na.otherPrisonerDetails.prisonerNumber) || [],
      }
    })
  }
}
