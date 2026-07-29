import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import { formatFirstLastName, parseDate } from '../../../../utils/utils'
import PrisonService from '../../../../services/prisonService'
import { Activity, ExclusionRevision } from '../../../../@types/activitiesAPI/types'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import { activitySlotsMinusExclusions, sessionSlotsToSchedule } from '../../../../utils/helpers/activityTimeSlotMappers'
import calcCurrentWeek from '../../../../utils/helpers/currentWeekCalculator'
import UserService from '../../../../services/userService'
import CaseNotesService from '../../../../services/caseNotesService'
import logger from '../../../../../logger'
import getCurrentPay from '../../../../utils/helpers/getCurrentPay'

const getLatestScheduleChanges = (allocatedTime: string | null | undefined, exclusionHistory: ExclusionRevision[]) => {
  const historicalRecords = allocatedTime
    ? exclusionHistory.filter(history => history.updatedDateTime > allocatedTime)
    : exclusionHistory

  if (!historicalRecords.length) {
    return {
      added: [],
      removed: [],
    }
  }

  const latestUpdatedDateTime = historicalRecords.reduce((latest, current) =>
    current.updatedDateTime > latest.updatedDateTime ? current : latest,
  ).updatedDateTime

  const latestChanges = historicalRecords.filter(record => record.updatedDateTime === latestUpdatedDateTime)

  const [latestChange] = latestChanges

  return {
    added: latestChanges.filter(history => history.revisionType === 'ADDED'),
    removed: latestChanges.filter(history => history.revisionType === 'REMOVED'),
    updatedBy: latestChange.updatedBy,
    latestUpdatedDateTime,
  }
}

export default class ViewAllocationRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
    private readonly caseNotesService: CaseNotesService,
    private readonly userService: UserService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { allocationId } = req.params

    const allocation = await this.activitiesService.getAllocation(+allocationId, user)

    const [activity, prisoner, exclusionHistory]: [Activity, Prisoner, ExclusionRevision[]] = await Promise.all([
      this.activitiesService.getActivity(allocation.activityId, user),
      this.prisonService.getInmateByPrisonerNumber(allocation.prisonerNumber, user),
      this.activitiesService.getAllocationExclusionsHistory(allocation.id, user),
    ])

    const prisonerName = formatFirstLastName(prisoner.firstName, prisoner.lastName)

    const isOnlyPay =
      activity.pay.filter(
        p => p.incentiveLevel === prisoner.currentIncentive?.level?.description && p.startDate == null,
      ).length === 1

    const currentPay = getCurrentPay(activity, allocation, prisoner)

    const schedule = activity.schedules[0]
    const allocationSlots = activitySlotsMinusExclusions(allocation.exclusions, schedule.slots)
    const dailySlots = sessionSlotsToSchedule(schedule.scheduleWeeks, allocationSlots)

    const currentWeek = calcCurrentWeek(parseDate(activity.startDate), schedule.scheduleWeeks)

    const isStarted = new Date(allocation.startDate) <= new Date()

    const {
      added: addedPrisonerExclusionHistory,
      removed: removedPrisonerExclusionHistory,
      updatedBy,
      latestUpdatedDateTime,
    } = getLatestScheduleChanges(allocation.allocatedTime, exclusionHistory)

    const userMap = await this.userService.getUserMap([allocation.plannedSuspension?.plannedBy, updatedBy], user)

    try {
      const allocatedByUser = await this.userService.getUserMap([allocation.allocatedBy], user)
      allocatedByUser.forEach((value, key) => userMap.set(key, value))
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      logger.info(`Handled allocatedBy user ${allocation.allocatedBy} not found.`)
    }

    const suspensionCaseNote = allocation.plannedSuspension?.dpsCaseNoteId
      ? await this.caseNotesService.getCaseNote(
          allocation.prisonerNumber,
          allocation.plannedSuspension?.dpsCaseNoteId,
          user,
        )
      : null

    res.render('pages/activities/manage-allocations/view-allocation', {
      allocation,
      prisonerName,
      pay: currentPay,
      isStarted,
      isOnlyPay,
      dailySlots,
      currentWeek,
      userMap,
      updatedBy,
      latestUpdatedDateTime,
      suspensionCaseNote,
      activityIsPaid: activity?.paid,
      exclusionHistory,
      addedPrisonerExclusionHistory,
      removedPrisonerExclusionHistory,
    })
  }
}
