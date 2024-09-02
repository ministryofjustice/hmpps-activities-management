import { Request, Response } from 'express'
import { Expose, Transform, Type } from 'class-transformer'
import { IsNotEmpty, ValidateIf } from 'class-validator'
import { compareAsc, startOfToday } from 'date-fns'
import PrisonService from '../../../../services/prisonService'
import ActivityService from '../../../../services/activitiesService'
import { ServiceUser } from '../../../../@types/express'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import { Activity, ActivityPay, Allocation, PrisonerAllocations } from '../../../../@types/activitiesAPI/types'
import { getScheduleIdFromActivity, getScheduleStartDateFromActivity, parseDate } from '../../../../utils/utils'
import { IepSummary, IncentiveLevel } from '../../../../@types/incentivesApi/types'
import HasAtLeastOne from '../../../../validators/hasAtLeastOne'
import { Slots } from '../../create-an-activity/journey'
import { sessionSlotsToSchedule } from '../../../../utils/helpers/activityTimeSlotMappers'
import calcCurrentWeek from '../../../../utils/helpers/currentWeekCalculator'
import WaitlistRequester from '../../../../enum/waitlistRequester'
import { parseIsoDate } from '../../../../utils/datePickerUtils'

type Filters = {
  candidateQuery: string
  incentiveLevelFilter: string
  riskLevelFilter: string
  employmentFilter: string
  waitlistStatusFilter: string
}

export class SelectedAllocation {
  @Expose()
  @ValidateIf(o => !o.selectedWaitlistApplication)
  @IsNotEmpty({ message: 'Select a candidate to allocate them' })
  selectedAllocation: string

  @Expose()
  @ValidateIf(o => !o.selectedAllocation)
  @Type(() => Number)
  @IsNotEmpty({ message: 'Select a waitlist application to allocate the candidate' })
  selectedWaitlistApplication: number
}

export class SelectedAllocations {
  @Expose()
  @Transform(({ value }) => [value].flat()) // Transform to an array if only one value is provided
  @HasAtLeastOne({ message: 'Select at least one prisoner' })
  selectedAllocations: string[]
}

export default class AllocationDashboardRoutes {
  constructor(
    private readonly prisonService: PrisonService,
    private readonly activitiesService: ActivityService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { activityId } = req.params
    const filters = req.query as Filters

    const [activity, incentiveLevels]: [Activity, IncentiveLevel[]] = await Promise.all([
      this.activitiesService.getActivity(+activityId, user),
      this.prisonService.getIncentiveLevels(user.activeCaseLoadId, user),
    ])

    const suitableForIep = this.getSuitableForIep(activity.pay, activity.paid, incentiveLevels)
    const suitableForWra = this.getSuitableForWra(activity.riskLevel)

    if (
      !(filters.incentiveLevelFilter || filters.riskLevelFilter || filters.employmentFilter || filters.candidateQuery)
    ) {
      filters.incentiveLevelFilter = suitableForIep
      filters.riskLevelFilter = 'Any Workplace Risk Assessment'
      filters.employmentFilter = 'Everyone'
    }

    const [currentlyAllocated, { waitlistedPrisoners, waitlistSize }, pagedCandidates] = await Promise.all([
      this.getCurrentlyAllocated(getScheduleIdFromActivity(activity), user),
      this.getWaitlistedPrisoners(getScheduleIdFromActivity(activity), filters, user),
      this.getCandidates(getScheduleIdFromActivity(activity), filters, +req.query.page, user),
    ])

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

    const slots: { [weekNumber: string]: Slots } = {}
    activity.schedules[0].slots.forEach(slot => {
      daysOfWeek.forEach(day => {
        const dayLowerCase = day.toLowerCase()
        slots[slot.weekNumber] ??= {
          days: [],
        }
        slots[slot.weekNumber][`timeSlots${day}`] ??= []

        if (slot[`${dayLowerCase}Flag`]) {
          if (!slots[slot.weekNumber].days.includes(dayLowerCase)) slots[slot.weekNumber].days.push(dayLowerCase)
          slots[slot.weekNumber][`timeSlots${day}`].push(slot.timeSlot)
        }
      })
    })

    const dailySlots = sessionSlotsToSchedule(activity.schedules[0].scheduleWeeks, activity.schedules[0].slots)

    const richStartDate = parseDate(activity.schedules[0].startDate)

    const activeAllocations = activity.schedules[0].allocations.filter(a => a.status === 'ACTIVE').length

    const currentWeek = calcCurrentWeek(richStartDate, activity.schedules[0].scheduleWeeks)

    res.render('pages/activities/allocation-dashboard/allocation-dashboard', {
      activity,
      schedule: activity.schedules[0],
      currentlyAllocated,
      waitlistedPrisoners,
      waitlistSize,
      pagedCandidates,
      incentiveLevels,
      filters,
      suitableForIep,
      suitableForWra,
      dailySlots,
      currentWeek,
      scheduleWeeks: activity.schedules[0].scheduleWeeks,
      activeAllocations,
    })
  }

  ALLOCATE = async (req: Request, res: Response): Promise<void> => {
    const { selectedAllocation, selectedWaitlistApplication } = req.body
    const { source } = req.query
    const { user } = res.locals

    let application
    if (selectedWaitlistApplication) {
      application = await this.activitiesService.fetchWaitlistApplication(selectedWaitlistApplication, user)
    }

    const prisonerNumber = selectedAllocation ?? application.prisonerNumber

    const [iepSummary, activity]: [IepSummary, Activity] = await Promise.all([
      this.prisonService.getPrisonerIepSummary(prisonerNumber, user),
      this.activitiesService.getActivity(+req.params.activityId, user),
    ])

    if (!activity.pay.map(p => p.incentiveLevel).includes(iepSummary.iepLevel) && activity.paid) {
      return res.validationFailed('selectedAllocation', 'No suitable pay rate exists for this candidate')
    }

    let redirectUrl = `/activities/allocations/create/prisoner/${prisonerNumber}?scheduleId=${getScheduleIdFromActivity(
      activity,
    )}`
    redirectUrl += source ? `&source=${source}` : ''
    return res.redirect(redirectUrl)
  }

  DEALLOCATE = async (req: Request, res: Response): Promise<void> => {
    const { activityId } = req.params
    const { user } = res.locals
    const { selectedAllocations } = req.body
    const activity = await this.activitiesService.getActivity(+activityId, user)
    if (parseIsoDate(getScheduleStartDateFromActivity(activity)) > startOfToday()) {
      res.redirect(
        `/activities/allocations/remove/end-decision?allocationIds=${selectedAllocations}&scheduleId=${getScheduleIdFromActivity(
          activity,
        )}`,
      )
    } else {
      res.redirect(
        `/activities/allocations/remove/end-date?allocationIds=${selectedAllocations}&scheduleId=${getScheduleIdFromActivity(
          activity,
        )}`,
      )
    }
  }

  VIEW_APPLICATION = async (req: Request, res: Response): Promise<void> => {
    const { selectedWaitlistApplication } = req.body
    const { user } = res.locals

    const application = await this.activitiesService.fetchWaitlistApplication(selectedWaitlistApplication, user)

    return res.redirect(`/activities/waitlist/view-and-edit/${application.id}/view`)
  }

  UPDATE = async (req: Request, res: Response): Promise<void> => {
    const { selectedAllocations } = req.body
    if (selectedAllocations.length > 1) {
      res.validationFailed('selectedAllocations', 'You can only select one allocation to edit')
    } else {
      res.redirect(`/activities/allocations/view/${selectedAllocations[0]}`)
    }
  }

  private getSuitableForIep = (pay: ActivityPay[], paidActivity: boolean, iepLevels: IncentiveLevel[]) => {
    const suitableIepLevels = iepLevels.filter(
      i => pay.map(p => p.incentiveNomisCode).includes(i.levelCode) || !paidActivity,
    )
    if (suitableIepLevels.length === iepLevels.length) return 'All Incentive Levels'
    return suitableIepLevels.map(i => i.levelName).join(', ')
  }

  private getSuitableForWra = (riskLevel: string) => {
    if (riskLevel === 'low') return 'Low'
    if (riskLevel === 'medium') return 'Low or Medium'
    return 'Low or Medium or High'
  }

  private getCurrentlyAllocated = async (scheduleId: number, user: ServiceUser) => {
    const currentlyAllocated = await this.activitiesService.getAllocationsWithParams(
      scheduleId,
      { activeOnly: true, includePrisonerSummary: true },
      user,
    )
    const prisonerNumbers = currentlyAllocated.map(allocation => allocation.prisonerNumber)
    const prisonerAllocations = await this.activitiesService.getActivePrisonPrisonerAllocations(prisonerNumbers, user)

    return currentlyAllocated.map(allocation => {
      let otherAllocations: Allocation[] = []
      if (prisonerAllocations.length > 0) {
        otherAllocations = prisonerAllocations
          .find(a => a.prisonerNumber === allocation.prisonerNumber)
          ?.allocations.filter(a => a.scheduleId !== scheduleId)
      }
      return {
        allocationId: allocation.id,
        name: allocation.prisonerName,
        prisonerNumber: allocation.prisonerNumber,
        prisonerPrisonCode: allocation.prisonerPrisonCode,
        prisonerStatus: allocation.prisonerStatus,
        cellLocation: allocation.cellLocation,
        earliestReleaseDate: allocation.earliestReleaseDate,
        startDate: parseDate(allocation.startDate),
        endDate: parseDate(allocation.endDate),
        status: allocation.status,
        plannedSuspension: allocation.plannedSuspension,
        otherAllocations: otherAllocations?.map(a => ({
          activityId: a.activityId,
          scheduleName: a.scheduleDescription,
        })),
      }
    })
  }

  private getWaitlistedPrisoners = async (scheduleId: number, filters: Filters, user: ServiceUser) => {
    const waitlist = await this.activitiesService
      .fetchActivityWaitlist(scheduleId, user)
      .then(a => a.filter(w => w.status === 'PENDING' || w.status === 'APPROVED' || w.status === 'DECLINED'))

    const prisonerNumbers = waitlist.map(application => application.prisonerNumber)
    const [inmateDetails, prisonerAllocations]: [Prisoner[], PrisonerAllocations[]] = await Promise.all([
      this.prisonService.searchInmatesByPrisonerNumbers(prisonerNumbers, user),
      this.activitiesService.getActivePrisonPrisonerAllocations(prisonerNumbers, user),
    ])

    const filteredWaitlist = inmateDetails
      .flatMap(inmate => {
        const thisWaitlist = waitlist.filter(a => a.prisonerNumber === inmate.prisonerNumber)
        const otherAllocations =
          prisonerAllocations
            .find(a => a.prisonerNumber === inmate.prisonerNumber)
            ?.allocations.filter(a => a.scheduleId !== scheduleId) || []

        return thisWaitlist.map(w => ({
          waitlistApplicationId: w.id,
          name: `${inmate.firstName} ${inmate.lastName}`,
          prisonerNumber: inmate.prisonerNumber,
          prisonerPrisonCode: inmate.prisonId,
          prisonerStatus: inmate.status,
          earliestReleaseDate: w.earliestReleaseDate,
          cellLocation: inmate.cellLocation,
          requestDate: parseDate(w.requestedDate),
          requestedBy: WaitlistRequester.valueOf(w.requestedBy),
          status: w.status,
          otherAllocations: otherAllocations?.map(a => ({
            activityId: a.activityId,
            scheduleName: a.scheduleDescription,
            isUnemployment: a.isUnemployment,
          })),
          alerts: inmate.alerts.filter(a => a.alertType === 'R' && ['RLO', 'RME', 'RHI'].includes(a.alertCode)),
          currentIncentive: inmate.currentIncentive?.level?.description,
        }))
      })
      .filter(
        inmate =>
          !filters.waitlistStatusFilter ||
          filters.waitlistStatusFilter === 'Any' ||
          inmate.status === filters.waitlistStatusFilter,
      )
      .filter(
        inmate =>
          !filters.employmentFilter ||
          filters.employmentFilter === 'Everyone' ||
          (inmate.otherAllocations.filter(a => !a.isUnemployment).length > 0 &&
            filters.employmentFilter === 'In work') ||
          (inmate.otherAllocations.filter(a => !a.isUnemployment).length === 0 &&
            filters.employmentFilter === 'Not in work'),
      )
      .filter(
        inmate =>
          !filters.riskLevelFilter ||
          filters.riskLevelFilter === 'Any Workplace Risk Assessment' ||
          (filters.riskLevelFilter === 'No Workplace Risk Assessment' && inmate.alerts.length === 0) ||
          this.getSuitableRiskLevelCodes(filters).includes(inmate.alerts.map(a => a.alertCode)[0]),
      )
      .filter(
        inmate =>
          !filters.incentiveLevelFilter ||
          filters.incentiveLevelFilter === 'All Incentive Levels' ||
          filters.incentiveLevelFilter.split(', ').includes(inmate.currentIncentive) ||
          filters.incentiveLevelFilter === inmate.currentIncentive,
      )
      .sort((a1, a2) => compareAsc(a1.requestDate, a2.requestDate))

    return {
      waitlistedPrisoners: filteredWaitlist,
      waitlistSize: waitlist.filter(w => w.status === 'PENDING' || w.status === 'APPROVED').length,
    }
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
