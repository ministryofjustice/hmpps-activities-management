import { Request, Response } from 'express'
import { ValidateNested } from 'class-validator'
import { plainToInstance, Transform } from 'class-transformer'
import _ from 'lodash'
import ActivitiesService from '../../../../services/activitiesService'
import getApplicableDaysAndSlotsInRegime, {
  DaysAndSlotsInRegime,
} from '../../../../utils/helpers/applicableRegimeTimeUtil'
import { Slots } from '../journey'
import { ActivityUpdateRequest, PrisonRegime, Slot } from '../../../../@types/activitiesAPI/types'
import TimeSlot from '../../../../enum/timeSlot'
import SimpleTime from '../../../../commonValidationTypes/simpleTime'
import {
  createCustomSlots,
  createSessionSlots,
  getMatchingSlots,
  SessionSlot,
  transformActivitySlotsToDailySlots,
} from '../../../../utils/helpers/activityTimeSlotMappers'
import { ServiceUser } from '../../../../@types/express'

export class SessionTimes {
  @Transform(({ value }) =>
    Object.keys(value).reduce((acc, k) => acc.set(k, plainToInstance(SimpleTime, value[k])), new Map()),
  )
  @ValidateNested()
  startTimes: Map<string, SimpleTime>

  @Transform(({ value }) =>
    Object.keys(value).reduce((acc, k) => acc.set(k, plainToInstance(SimpleTime, value[k])), new Map()),
  )
  @ValidateNested()
  endTimes: Map<string, SimpleTime>
}

function startDateBeforeEarlierSession(customSlot: Slot, allSlots: Slot[]): boolean {
  // no need to check if it's AM
  if (customSlot.timeSlot === TimeSlot.AM) {
    return false
  }
  const amSlotStartTime: string = allSlots.find(
    slot => slot.timeSlot === TimeSlot.AM && _.isEqual(slot.daysOfWeek, customSlot.daysOfWeek),
  )?.customStartTime

  // check any PM or ED session is after any AM start time
  if (
    amSlotStartTime !== undefined &&
    ((customSlot.timeSlot === TimeSlot.PM && customSlot.customStartTime.localeCompare(amSlotStartTime) <= 0) ||
      (customSlot.timeSlot === TimeSlot.ED && customSlot.customStartTime.localeCompare(amSlotStartTime) <= 0))
  ) {
    return true
  }

  const pmSlotStartTime: string = allSlots.find(
    slot => slot.timeSlot === TimeSlot.PM && _.isEqual(slot.daysOfWeek, customSlot.daysOfWeek),
  )?.customStartTime

  // check an ED session is after any PM start time
  return (
    customSlot.timeSlot === TimeSlot.ED &&
    pmSlotStartTime !== undefined &&
    customSlot.customStartTime.localeCompare(pmSlotStartTime) <= 0
  )
}

export default class SessionTimesRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const regimeTimes = await this.activitiesService.getPrisonRegime(user.activeCaseLoadId, user)
    const { activityId, slots, scheduleWeeks } = req.session.createJourney

    const sessionSlots = await this.getDaysAndSlotsByWeek(
      regimeTimes,
      slots,
      scheduleWeeks,
      req.params.mode === 'edit',
      +activityId,
      user,
    )

    res.render(`pages/activities/create-an-activity/session-times`, {
      sessionSlots,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { activityId, name, scheduleWeeks } = req.session.createJourney
    const { startTimes, endTimes }: SessionTimes = req.body
    const { preserveHistory } = req.query

    const startTimesObj = Array.from(startTimes.keys()).reduce((acc, key) => {
      acc[key] = startTimes.get(key)
      return acc
    }, {})

    const endTimesObj = Array.from(endTimes.keys()).reduce((acc, key) => {
      acc[key] = endTimes.get(key)
      return acc
    }, {})
    req.body.startTimes = startTimesObj
    req.body.endTimes = endTimesObj

    const customSlots: Slot[] = createCustomSlots(startTimes, endTimes)

    // validate slots
    const slotsWithStartAfterEnd: Slot[] = customSlots.filter(
      (customSlot: Slot) => customSlot.customStartTime.localeCompare(customSlot.customEndTime) >= 0,
    )
    if (slotsWithStartAfterEnd.length > 0) {
      slotsWithStartAfterEnd.forEach(customSlot => {
        res.addValidationError(
          `endTimes-${customSlot.weekNumber}-${customSlot.daysOfWeek}-${customSlot.timeSlot}`,
          'Select an end time after the start time',
        )
      })
      return res.validationFailed()
    }

    const slotsStartingBeforeEarlierSession: Slot[] = customSlots.filter((customSlot: Slot) =>
      startDateBeforeEarlierSession(customSlot, customSlots),
    )
    if (slotsStartingBeforeEarlierSession.length > 0) {
      slotsStartingBeforeEarlierSession.forEach(customSlot => {
        res.addValidationError(
          `startTimes-${customSlot.weekNumber}-${customSlot.daysOfWeek}-${customSlot.timeSlot}`,
          'Start time must be after the earlier session start time',
        )
      })
      return res.validationFailed()
    }

    req.session.createJourney.customSlots = customSlots

    if (req.params.mode === 'edit') {
      const activity = {
        slots: req.session.createJourney.customSlots,
        scheduleWeeks,
      } as ActivityUpdateRequest
      await this.activitiesService.updateActivity(activityId, activity, user)
      const successMessage = `You've updated the daily schedule for ${name}`
      return res.redirectWithSuccess(`/activities/view/${activityId}`, 'Activity updated', successMessage)
    }

    if (preserveHistory === 'true') {
      return res.redirect('check-answers')
    }

    return res.redirectOrReturn(`bank-holiday-option`)
  }

  private getDaysAndSlotsByWeek = async (
    regimeTimes: PrisonRegime[],
    slots: { [p: string]: Slots },
    scheduleWeeks: number,
    editModeActive: boolean,
    activityId: number,
    user: ServiceUser,
  ): Promise<Map<string, DaysAndSlotsInRegime[] | SessionSlot[]>> => {
    const sessionSlots = new Map<string, DaysAndSlotsInRegime[] | SessionSlot[]>()

    if (editModeActive) {
      const activity = await this.activitiesService.getActivity(activityId, user)
      const activitySchedule = activity.schedules[0]

      for (let weekNumber = 1; weekNumber <= activitySchedule.scheduleWeeks; weekNumber += 1) {
        const existingSlots = transformActivitySlotsToDailySlots(
          activitySchedule.slots.filter(slot => slot.weekNumber === weekNumber),
        )
        sessionSlots.set(weekNumber.toString(), getMatchingSlots(existingSlots, slots[weekNumber.toString()]))
      }
      return sessionSlots
    }

    for (let weekNumber = 1; weekNumber <= scheduleWeeks; weekNumber += 1) {
      const applicableRegimeTimesForActivity: DaysAndSlotsInRegime[] = getApplicableDaysAndSlotsInRegime(
        regimeTimes,
        slots[weekNumber.toString()],
      )
      sessionSlots.set(weekNumber.toString(), createSessionSlots(applicableRegimeTimesForActivity))
    }

    return sessionSlots
  }
}
