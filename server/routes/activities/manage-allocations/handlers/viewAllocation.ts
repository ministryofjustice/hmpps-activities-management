import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import { convertToTitleCase, parseDate } from '../../../../utils/utils'
import PrisonService from '../../../../services/prisonService'
import { Activity } from '../../../../@types/activitiesAPI/types'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import { activitySlotsMinusExclusions, sessionSlotsToSchedule } from '../../../../utils/helpers/activityTimeSlotMappers'
import calcCurrentWeek from '../../../../utils/helpers/currentWeekCalculator'
import UserService from '../../../../services/userService'
import CaseNotesService from '../../../../services/caseNotesService'
import logger from '../../../../../logger'
import getCurrentPay from '../../../../utils/helpers/getCurrentPay'

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

    const [activity, prisoner]: [Activity, Prisoner] = await Promise.all([
      this.activitiesService.getActivity(allocation.activityId, user),
      this.prisonService.getInmateByPrisonerNumber(allocation.prisonerNumber, user),
    ])

    const prisonerName = convertToTitleCase(`${prisoner.firstName} ${prisoner.lastName}`)

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

    const userMap = await this.userService.getUserMap([allocation.plannedSuspension?.plannedBy], user)

    try {
      const allocatedByUser = await this.userService.getUserMap([allocation.allocatedBy], user)
      allocatedByUser.forEach((value, key) => userMap.set(key, value))
    } catch (e) {
      logger.info(`Handled allocatedBy user ${allocation.allocatedBy} not found.`)
    }

    const suspensionCaseNote = allocation.plannedSuspension?.caseNoteId
      ? await this.caseNotesService.getCaseNote(
          allocation.prisonerNumber,
          allocation.plannedSuspension?.caseNoteId,
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
      suspensionCaseNote,
    })
  }
}
