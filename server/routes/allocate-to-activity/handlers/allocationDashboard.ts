import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import PrisonService from '../../../services/prisonService'
import ActivityService from '../../../services/activitiesService'
import CapacitiesService from '../../../services/capacitiesService'
import { ServiceUser } from '../../../@types/express'
import { Prisoner } from '../../../@types/prisonerOffenderSearchImport/types'
import { PrisonerAllocations } from '../../../@types/activitiesAPI/types'
import { parseDate } from '../../../utils/utils'

export class SelectedAllocation {
  @Expose()
  @IsNotEmpty({ message: 'Select a candidate to allocate them' })
  selectedAllocation: string
}

export default class AllocationDashboardRoutes {
  constructor(
    private readonly prisonService: PrisonService,
    private readonly capacitiesService: CapacitiesService,
    private readonly activitiesService: ActivityService
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { scheduleId } = req.params

    const [schedule, allocationSummaryView, currentlyAllocated, candidates] = await Promise.all([
      this.activitiesService.getActivitySchedule(+scheduleId, user),
      this.capacitiesService.getScheduleAllocationsSummary(+scheduleId, user),
      this.getCurrentlyAllocated(+scheduleId, user),
      this.getCandidates(+scheduleId, user),
    ])

    res.render('pages/allocate-to-activity/allocation-dashboard', {
      allocationSummaryView,
      schedule,
      currentlyAllocated,
      candidates,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { selectedAllocation } = req.body
    res.redirect(`allocate/${selectedAllocation}`)
  }

  private getCurrentlyAllocated = async (scheduleId: number, user: ServiceUser) => {
    const currentlyAllocated = await this.activitiesService.getAllocations(scheduleId, user)
    const prisonerNumbers = currentlyAllocated.map(allocation => allocation.prisonerNumber)
    const [inmateDetails, prisonerAllocations]: [Prisoner[], PrisonerAllocations[]] = await Promise.all([
      this.prisonService.searchInmatesByPrisonerNumbers(prisonerNumbers, user),
      this.activitiesService.getPrisonerAllocations(user.activeCaseLoad.caseLoadId, prisonerNumbers, user),
    ])

    return inmateDetails.map(inmate => {
      const thisAllocation = currentlyAllocated.find(a => a.prisonerNumber === inmate.prisonerNumber)
      const otherAllocations = prisonerAllocations
        .find(a => a.prisonerNumber === inmate.prisonerNumber)
        .allocations.filter(a => a.scheduleId !== scheduleId)

      return {
        name: `${inmate.firstName} ${inmate.lastName}`,
        prisonerNumber: inmate.prisonerNumber,
        cellLocation: inmate.cellLocation,
        releaseDate: inmate.conditionalReleaseDate ? parseDate(inmate.conditionalReleaseDate) : null,
        dateAllocated: parseDate(thisAllocation.allocatedTime, "yyyy-MM-dd'T'HH:mm:ss"),
        otherAllocations: otherAllocations.map(a => ({
          id: a.scheduleId,
          scheduleName: a.scheduleDescription,
        })),
      }
    })
  }

  private getCandidates = async (scheduleId: number, user: ServiceUser) => {
    // TODO: Filtering logic will be added in here
    const currentlyAllocated = await this.activitiesService
      .getAllocations(scheduleId, user)
      .then(allocations => allocations.map(allocation => allocation.prisonerNumber))

    return this.prisonService
      .getInmates(user.activeCaseLoad.caseLoadId, user)
      .then(page => page.content)
      .then(inmates => inmates.filter(i => !currentlyAllocated.includes(i.prisonerNumber)))
      .then(inmates => inmates.filter(i => i.status === 'ACTIVE IN').filter(i => i.legalStatus !== 'DEAD'))
      .then(inmates =>
        inmates.map(inmate => ({
          name: `${inmate.firstName} ${inmate.lastName}`,
          prisonerNumber: inmate.prisonerNumber,
          cellLocation: inmate.cellLocation,
          releaseDate: inmate.conditionalReleaseDate ? parseDate(inmate.conditionalReleaseDate) : null,
        }))
      )
  }
}
