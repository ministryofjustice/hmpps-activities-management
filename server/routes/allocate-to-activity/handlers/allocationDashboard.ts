import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import PrisonService from '../../../services/prisonService'
import ActivityService from '../../../services/activitiesService'
import CapacitiesService from '../../../services/capacitiesService'
import { ServiceUser } from '../../../@types/express'
import { Prisoner } from '../../../@types/prisonerOffenderSearchImport/types'
import { ActivitySchedule, PrisonerAllocations } from '../../../@types/activitiesAPI/types'
import { parseDate } from '../../../utils/utils'
import { IepLevel } from '../../../@types/incentivesApi/types'

type Filters = {
  candidateQuery: string
  incentiveLevelFilter: string
  riskLevelFilter: string
}

export class SelectedAllocation {
  @Expose()
  @IsNotEmpty({ message: 'Select a candidate to allocate them' })
  selectedAllocation: string
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

    if (Object.values(filters).length === 0) {
      filters.incentiveLevelFilter = suitableForIep
      filters.riskLevelFilter = suitableForWra
    }

    const [allocationSummaryView, currentlyAllocated, candidates] = await Promise.all([
      this.capacitiesService.getScheduleAllocationsSummary(+scheduleId, user),
      this.getCurrentlyAllocated(+scheduleId, user),
      this.getCandidates(+scheduleId, filters, user),
    ])

    res.render('pages/allocate-to-activity/allocation-dashboard', {
      allocationSummaryView,
      schedule,
      currentlyAllocated,
      candidates,
      incentiveLevels,
      filters,
      suitableForIep,
      suitableForWra,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { selectedAllocation } = req.body
    res.redirect(`allocate/${selectedAllocation}`)
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
        releaseDate: inmate.releaseDate ? parseDate(inmate.releaseDate) : null,
        dateAllocated: parseDate(thisAllocation.allocatedTime, "yyyy-MM-dd'T'HH:mm:ss"),
        otherAllocations: otherAllocations.map(a => ({
          id: a.scheduleId,
          scheduleName: a.scheduleDescription,
        })),
      }
    })
  }

  private getCandidates = async (scheduleId: number, filters: Filters, user: ServiceUser) => {
    const candidateQueryLower = filters.candidateQuery?.toLowerCase()
    const suitableIeps = filters.incentiveLevelFilter?.split(' or ')
    const suitableWpas = filters.riskLevelFilter?.split(' or ')

    const currentlyAllocated = await this.activitiesService
      .getAllocations(scheduleId, user)
      .then(allocations => allocations.map(allocation => allocation.prisonerNumber))

    const pageOfInmates = await this.prisonService
      .getInmates(user.activeCaseLoad.caseLoadId, user)
      .then(page => page.content)
      .then(inmates => inmates.filter(i => !currentlyAllocated.includes(i.prisonerNumber)))
      .then(inmates => inmates.filter(i => i.status === 'ACTIVE IN').filter(i => i.legalStatus !== 'DEAD'))
      .then(inmates =>
        inmates.filter(
          i =>
            filters.incentiveLevelFilter === 'All Incentive Levels' ||
            !suitableIeps ||
            suitableIeps.includes(i.currentIncentive.level.description),
        ),
      )
      .then(inmates => this.filterByWra(inmates, filters, suitableWpas))
      .then(inmates =>
        inmates.filter(
          i =>
            !candidateQueryLower ||
            i.prisonerNumber.toLowerCase().includes(candidateQueryLower) ||
            `${i.firstName} ${i.lastName}`.toLowerCase().includes(candidateQueryLower),
        ),
      )

    const currentAllocations = await this.activitiesService.getPrisonerAllocations(
      user.activeCaseLoad.caseLoadId,
      pageOfInmates.map(i => i.prisonerNumber),
      user,
    )

    return pageOfInmates.map(inmate => ({
      name: `${inmate.firstName} ${inmate.lastName}`,
      prisonerNumber: inmate.prisonerNumber,
      otherAllocations:
        currentAllocations
          .find(a => a.prisonerNumber === inmate.prisonerNumber)
          ?.allocations.map(a => ({
            id: a.scheduleId,
            scheduleName: a.scheduleDescription,
          })) || [],
      cellLocation: inmate.cellLocation,
      releaseDate: inmate.releaseDate ? parseDate(inmate.releaseDate) : null,
    }))
  }

  private filterByWra = (inmates: Prisoner[], filters: Filters, suitableWras: string[]): Prisoner[] => {
    /* Alert codes mapping to workplace risk assessments:
       RHI - High
       RME - Medium
       RLO - Low
     */
    const allAlertCodes = ['RHI', 'RME', 'RLO']
    const suitableAlertCodes = suitableWras?.map(w => `R${w.toUpperCase().slice(0, 2)}`)

    return inmates.filter(
      i =>
        !suitableWras ||
        filters.riskLevelFilter === 'Any Workplace Risk Assessment' ||
        (filters.riskLevelFilter === 'No Workplace Risk Assessment' &&
          i.alerts.find(a => a.alertType === 'R' && allAlertCodes.includes(a.alertCode)) === undefined) ||
        i.alerts.find(a => a.alertType === 'R' && suitableAlertCodes.includes(a.alertCode)) !== undefined,
    )
  }
}
