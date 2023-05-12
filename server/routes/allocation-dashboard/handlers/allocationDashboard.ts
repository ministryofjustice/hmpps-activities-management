import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import PrisonService from '../../../services/prisonService'
import ActivityService from '../../../services/activitiesService'
import CapacitiesService from '../../../services/capacitiesService'
import { ServiceUser } from '../../../@types/express'
import { Prisoner } from '../../../@types/prisonerOffenderSearchImport/types'
import { ActivitySchedule, PrisonerAllocations } from '../../../@types/activitiesAPI/types'
import { parseDate } from '../../../utils/utils'
import { IepLevel } from '../../../@types/incentivesApi/types'
import HasAtLeastOne from '../../../validators/hasAtLeastOne'

type Filters = {
  candidateQuery: string
  incentiveLevelFilter: string
  riskLevelFilter: string
  employmentFilter: string
}

export class SelectedAllocation {
  @Expose()
  @IsNotEmpty({ message: 'Select a candidate to allocate them' })
  selectedAllocation: string
}

export class SelectedAllocations {
  @Expose()
  @Expose()
  @Transform(({ value }) => [value].flat()) // Transform to an array if only one value is provided
  @HasAtLeastOne({ message: 'Select at least one prisoner' })
  selectedAllocations: string[]
}

export default class AllocationDashboardRoutes {
  constructor(
    private readonly prisonService: PrisonService,
    private readonly capacitiesService: CapacitiesService,
    private readonly activitiesService: ActivityService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { scheduleId } = req.params
    const filters = req.query as Filters

    const [schedule, incentiveLevels]: [ActivitySchedule, IepLevel[]] = await Promise.all([
      this.activitiesService.getActivitySchedule(+scheduleId, user),
      this.prisonService.getIncentiveLevels(user.activeCaseLoad.caseLoadId, user),
    ])

    const suitableForIep = this.getSuitableForIep(schedule.activity.minimumIncentiveLevel, incentiveLevels)
    const suitableForWra = this.getSuitableForWra(schedule.activity.riskLevel)

    if (
      !(filters.incentiveLevelFilter || filters.riskLevelFilter || filters.employmentFilter || filters.candidateQuery)
    ) {
      filters.incentiveLevelFilter = suitableForIep
      filters.riskLevelFilter = suitableForWra
      filters.employmentFilter = 'Not in work'
    }

    const [allocationSummaryView, currentlyAllocated, pagedCandidates] = await Promise.all([
      this.capacitiesService.getScheduleAllocationsSummary(+scheduleId, user),
      this.getCurrentlyAllocated(+scheduleId, user),
      this.getCandidates(+scheduleId, filters, +req.query.page, user),
    ])

    res.render('pages/allocation-dashboard/allocation-dashboard', {
      allocationSummaryView,
      schedule,
      currentlyAllocated,
      pagedCandidates,
      incentiveLevels,
      filters,
      suitableForIep,
      suitableForWra,
    })
  }

  ALLOCATE = async (req: Request, res: Response): Promise<void> => {
    const { selectedAllocation } = req.body
    res.redirect(`/allocate/prisoner/${selectedAllocation}?scheduleId=${req.params.scheduleId}`)
  }

  DEALLOCATE = async (req: Request, res: Response): Promise<void> => {
    // TODO: Start the deallocation journey here

    const { selectedAllocations } = req.body
    res.status(200)
    res.send(`${selectedAllocations.pop()}`)
  }

  private getSuitableForIep = (minimumIncentiveLevel: string, iepLevels: IepLevel[]) => {
    let string = ''
    let sequenceOfMinimumIep: number
    iepLevels.forEach(i => {
      if (i.iepDescription === minimumIncentiveLevel) {
        string = i.iepDescription
        sequenceOfMinimumIep = i.sequence
      }

      if (i.sequence > sequenceOfMinimumIep) {
        string = `${string} or ${i.iepDescription}`
      }
    })

    if (string.split(' or ').length === iepLevels.length) {
      string = 'All Incentive Levels'
    }
    return string
  }

  private getSuitableForWra = (riskLevel: string) => {
    if (riskLevel === 'low') return 'Low'
    if (riskLevel === 'medium') return 'Low or Medium'
    return 'Low or Medium or High'
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
        releaseDate: parseDate(inmate.releaseDate),
        startDate: parseDate(thisAllocation.startDate),
        endDate: parseDate(thisAllocation.endDate),
        otherAllocations: otherAllocations.map(a => ({
          id: a.scheduleId,
          scheduleName: a.scheduleDescription,
        })),
      }
    })
  }

  private getCandidates = async (scheduleId: number, filters: Filters, pageNumber: number, user: ServiceUser) => {
    const candidateQueryLower = filters.candidateQuery?.toLowerCase()
    const suitableIeps = this.getSuitableIepLevels(filters)
    const suitableWpas = this.getSuitableRiskLevelCodes(filters)
    const suitableForEmployed = this.getSuitableForEmployed(filters)

    return this.activitiesService.getActivityCandidates(
      scheduleId,
      user,
      suitableIeps,
      suitableWpas,
      suitableForEmployed,
      candidateQueryLower,
      pageNumber,
    )
  }

  private getSuitableIepLevels = (filters: Filters): string[] => {
    if (filters.incentiveLevelFilter === 'All Incentive Levels') {
      return undefined
    }

    return filters.incentiveLevelFilter?.split(' or ')
  }

  private getSuitableRiskLevelCodes = (filters: Filters): string[] => {
    /* Alert codes mapping to workplace risk assessments:
       RHI - High
       RME - Medium
       RLO - Low
     */

    if (filters.riskLevelFilter === 'Any Workplace Risk Assessment') {
      return undefined
    }

    if (filters.riskLevelFilter === 'No Workplace Risk Assessment') {
      return ['NONE']
    }

    return filters.riskLevelFilter?.split(' or ')?.map(w => `R${w.toUpperCase().slice(0, 2)}`)
  }

  private getSuitableForEmployed = (filters: Filters): boolean => {
    if (filters.employmentFilter === 'Not in work') {
      return false
    }

    if (filters.employmentFilter === 'In work') {
      return true
    }

    return undefined
  }
}
