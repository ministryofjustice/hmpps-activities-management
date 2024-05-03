import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import { convertToTitleCase, mapActivityModelSlotsToJourney, parseDate } from '../../../../utils/utils'
import PrisonService from '../../../../services/prisonService'
import { Activity } from '../../../../@types/activitiesAPI/types'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import activitySessionToDailyTimeSlots, {
  activitySlotsMinusExclusions,
} from '../../../../utils/helpers/activityTimeSlotMappers'
import calcCurrentWeek from '../../../../utils/helpers/currentWeekCalculator'
import UserService from '../../../../services/userService'
import CaseNotesService from '../../../../services/caseNotesService'

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
      activity.pay.filter(p => p.incentiveLevel === prisoner.currentIncentive?.level?.description).length === 1
    const pay = activity.pay.find(
      a =>
        a.prisonPayBand.id === allocation.prisonPayBand.id &&
        a.incentiveLevel === prisoner.currentIncentive?.level?.description,
    )

    const schedule = activity.schedules[0]
    const allocationSlots = activitySlotsMinusExclusions(allocation.exclusions, schedule.slots)
    const journeySlots = mapActivityModelSlotsToJourney(allocationSlots)
    const dailySlots = activitySessionToDailyTimeSlots(schedule.scheduleWeeks, journeySlots)

    const currentWeek = calcCurrentWeek(parseDate(activity.startDate), schedule.scheduleWeeks)

    const isStarted = new Date(allocation.startDate) <= new Date()

    const userMap = await this.userService.getUserMap(
      [allocation.plannedSuspension?.plannedBy, allocation.allocatedBy],
      user,
    )

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
      pay,
      isStarted,
      isOnlyPay,
      dailySlots,
      currentWeek,
      userMap,
      suspensionCaseNote,
    })
  }
}
