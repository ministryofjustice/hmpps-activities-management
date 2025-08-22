import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import { formatFirstLastName } from '../../../../utils/utils'
import { Allocation } from '../../../../@types/activitiesAPI/types'
import { ServiceUser } from '../../../../@types/express'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import getCurrentPay from '../../../../utils/helpers/getCurrentPay'

export default class ViewAllocationsRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { prisonerNumber } = req.params
    const { user } = res.locals

    const prisoner = await this.prisonService.getInmateByPrisonerNumber(prisonerNumber, user)

    const allocations = await this.activitiesService
      .getActivePrisonPrisonerAllocations([prisonerNumber], user)
      .then(r => r.flatMap(a => a.allocations))

    const activeAllocations = allocations.filter(all => !all.plannedSuspension)

    const enhancedActiveAllocations = await this.enhanceActiveAllocations(activeAllocations, prisoner, res.locals.user)

    const suspendedAllocations = allocations
      .filter(all => all.plannedSuspension)
      .sort((a, b) => (a.plannedSuspension.plannedStartDate < b.plannedSuspension.plannedStartDate ? -1 : 1))

    const sortedActiveAllocations = enhancedActiveAllocations.sort((a, b) =>
      a.activitySummary < b.activitySummary ? -1 : 1,
    )

    res.render('pages/activities/suspensions/view-allocations', {
      prisonerNumber,
      prisonerName: formatFirstLastName(prisoner.firstName, prisoner.lastName),
      allocationCount: allocations?.length,
      suspendedAllocations,
      activeAllocations: sortedActiveAllocations,
      activeAllocationIdsForSuspending: activeAllocations.map(allocation => allocation.id),
    })
  }

  private enhanceActiveAllocations = async (activeAllocations: Allocation[], prisoner: Prisoner, user: ServiceUser) => {
    return Promise.all(
      activeAllocations.map(async allocation => {
        const activity = await this.activitiesService.getActivity(allocation.activityId, user)
        if (!activity.paid) return allocation

        const currentPay = getCurrentPay(activity, allocation, prisoner)
        return {
          ...allocation,
          payRate: currentPay?.rate,
        }
      }),
    )
  }
}
