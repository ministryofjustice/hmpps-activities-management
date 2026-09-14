import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import { formatFirstLastName } from '../../../../utils/utils'
import getCurrentPay from '../../../../utils/helpers/getCurrentPay'

export default class ViewAllocationsRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { prisonerNumber } = req.params as { prisonerNumber: string }
    const { user } = res.locals

    req.session.prisonerSearchBackLinkHref = `/activities/suspensions/prisoner/${prisonerNumber}`

    const [prisoner, prisonerAllocations] = await Promise.all([
      this.prisonService.getInmateByPrisonerNumber(prisonerNumber, user),
      this.activitiesService.getActivePrisonPrisonerAllocations([prisonerNumber], user),
    ])

    const allocations = prisonerAllocations.flatMap(result => result.allocations)

    const activityIds = [...new Set(allocations.map(allocation => allocation.activityId))]

    const activityEntries = await Promise.all(
      activityIds.map(
        async activityId => [activityId, await this.activitiesService.getActivity(activityId, user)] as const,
      ),
    )

    const activitiesById = new Map(activityEntries)

    const enhancedAllocations = allocations.map(allocation => {
      const activity = activitiesById.get(allocation.activityId)

      if (!activity) {
        throw new Error(`Activity ${allocation.activityId} not found for allocation ${allocation.id}`)
      }

      if (!activity.paid) {
        return {
          ...allocation,
          outsideWork: activity.outsideWork,
        }
      }

      const currentPay = getCurrentPay(activity, allocation, prisoner)

      return {
        ...allocation,
        payRate: currentPay?.rate,
        outsideWork: activity.outsideWork,
      }
    })

    const activeAllocations = enhancedAllocations
      .filter(allocation => !allocation.plannedSuspension)
      .sort((a, b) => a.activitySummary.localeCompare(b.activitySummary))

    const suspendedAllocations = enhancedAllocations
      .filter(allocation => allocation.plannedSuspension)
      .sort((a, b) => a.plannedSuspension.plannedStartDate.localeCompare(b.plannedSuspension.plannedStartDate))

    res.render('pages/activities/suspensions/view-allocations', {
      prisonerNumber,
      prisonerName: formatFirstLastName(prisoner.firstName, prisoner.lastName),
      allocationCount: allocations.length,
      suspendedAllocations,
      activeAllocations,
      activeAllocationIdsForSuspending: activeAllocations.map(allocation => allocation.id),
    })
  }
}
