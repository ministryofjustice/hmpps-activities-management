import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import PrisonService from '../../../../services/prisonService'
import ActivityService from '../../../../services/activitiesService'
import { ServiceUser } from '../../../../@types/express'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import { Activity, ActivityPay, Allocation, PrisonerAllocations } from '../../../../@types/activitiesAPI/types'
import { convertToTitleCase, parseDate } from '../../../../utils/utils'
import { IepSummary, IncentiveLevel } from '../../../../@types/incentivesApi/types'
import HasAtLeastOne from '../../../../validators/hasAtLeastOne'

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
  constructor(private readonly prisonService: PrisonService, private readonly activitiesService: ActivityService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { activityId } = req.params
    const filters = req.query as Filters

    const [activity, incentiveLevels]: [Activity, IncentiveLevel[]] = await Promise.all([
      this.activitiesService.getActivity(+activityId, user),
      this.prisonService.getIncentiveLevels(user.activeCaseLoad.caseLoadId, user),
    ])

    const suitableForIep = this.getSuitableForIep(activity.pay, incentiveLevels)
    const suitableForWra = this.getSuitableForWra(activity.riskLevel)

    if (
      !(filters.incentiveLevelFilter || filters.riskLevelFilter || filters.employmentFilter || filters.candidateQuery)
    ) {
      filters.incentiveLevelFilter = suitableForIep
      filters.riskLevelFilter = 'Any Workplace Risk Assessment'
      filters.employmentFilter = 'Not in work'
    }

    const [currentlyAllocated, pagedCandidates] = await Promise.all([
      this.getCurrentlyAllocated(+activityId, user),
      this.getCandidates(+activityId, filters, +req.query.page, user),
    ])

    res.render('pages/activities/allocation-dashboard/allocation-dashboard', {
      schedule: activity.schedules[0],
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
    const { user } = res.locals

    const [iepSummary, activity]: [IepSummary, Activity] = await Promise.all([
      this.prisonService.getPrisonerIepSummary(selectedAllocation, user),
      this.activitiesService.getActivity(+req.params.activityId, user),
    ])

    if (!activity.pay.map(p => p.incentiveLevel).includes(iepSummary.iepLevel)) {
      return res.validationFailed('selectedAllocation', 'No suitable pay rate exists for this candidate')
    }
    return res.redirect(`/activities/allocate/prisoner/${selectedAllocation}?scheduleId=${req.params.activityId}`)
  }

  DEALLOCATE = async (req: Request, res: Response): Promise<void> => {
    const { selectedAllocations } = req.body
    const { user } = res.locals

    const schedule = await this.activitiesService.getActivitySchedule(+req.params.activityId, user)

    req.session.deallocateJourney = {
      allocationsToRemove: selectedAllocations,
      scheduleId: schedule.id,
      activityName: schedule.activity.description,
    }

    req.session.deallocateJourney.prisoners = await this.prisonService
      .searchInmatesByPrisonerNumbers(selectedAllocations, user)
      .then(inmates =>
        inmates.map(i => ({
          name: convertToTitleCase(`${i.firstName} ${i.lastName}`),
          prisonerNumber: i.prisonerNumber,
          cellLocation: i.cellLocation,
        })),
      )

    res.redirect(`/activities/deallocate/date`)
  }

  UPDATE = async (req: Request, res: Response): Promise<void> => {
    const { selectedAllocations } = req.body
    if (selectedAllocations.length > 1) {
      res.validationFailed('selectedAllocations', 'You can only select one allocation to edit')
    } else {
      res.redirect(
        `/activities/allocation-dashboard/${req.params.activityId}/check-allocation/${selectedAllocations[0]}`,
      )
    }
  }

  private getSuitableForIep = (pay: ActivityPay[], iepLevels: IncentiveLevel[]) => {
    const suitableIepLevels = iepLevels.filter(i => pay.map(p => p.incentiveNomisCode).includes(i.levelCode))
    if (suitableIepLevels.length === iepLevels.length) return 'All Incentive Levels'
    return suitableIepLevels.map(i => i.levelName).join(', ')
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
      this.activitiesService.getActivePrisonPrisonerAllocations(prisonerNumbers, user),
    ])

    return inmateDetails.map(inmate => {
      const thisAllocation = currentlyAllocated.find(a => a.prisonerNumber === inmate.prisonerNumber)
      let otherAllocations: Allocation[] = []
      if (prisonerAllocations.length > 0) {
        otherAllocations = prisonerAllocations
          .find(a => a.prisonerNumber === inmate.prisonerNumber)
          ?.allocations.filter(a => a.scheduleId !== scheduleId)
      }
      return {
        allocationId: thisAllocation.id,
        name: `${inmate.firstName} ${inmate.lastName}`,
        prisonerNumber: inmate.prisonerNumber,
        cellLocation: inmate.cellLocation,
        releaseDate: parseDate(inmate.releaseDate),
        startDate: parseDate(thisAllocation.startDate),
        endDate: parseDate(thisAllocation.endDate),
        otherAllocations: otherAllocations?.map(a => ({
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

    return filters.incentiveLevelFilter?.split(', ')
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
