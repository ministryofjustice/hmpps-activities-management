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
  transformActivitySlotsToDailySlots,
} from '../../../../utils/helpers/activityTimeSlotMappers'
import { ServiceUser } from '../../../../@types/express'

type SessionSlot = {
  dayOfWeek: string
  timeSlot: TimeSlot
  start: string
  finish: string
}
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

function createSessionSlots(applicableRegimeTimesForActivity: DaysAndSlotsInRegime[]): SessionSlot[] {
  const sessionSlots: SessionSlot[] = []
  applicableRegimeTimesForActivity.forEach(day => {
    if (day.amStart) {
      sessionSlots.push({
        dayOfWeek: day.dayOfWeek,
        timeSlot: TimeSlot.AM,
        start: day.amStart,
        finish: day.amFinish,
      })
    }
    if (day.pmStart) {
      sessionSlots.push({
        dayOfWeek: day.dayOfWeek,
        timeSlot: TimeSlot.PM,
        start: day.pmStart,
        finish: day.pmFinish,
      })
    }
    if (day.edStart) {
      sessionSlots.push({
        dayOfWeek: day.dayOfWeek,
        timeSlot: TimeSlot.ED,
        start: day.edStart,
        finish: day.edFinish,
      })
    }
  })

  return sessionSlots
}

function addNewEmptySlotsIfRequired(sessionSlots: SessionSlot[], newlySelectedSlots: Slots): SessionSlot[] {
  // Make the day format match
  const days = newlySelectedSlots.days.map(day => day.toUpperCase())

  days.forEach(day => {
    const timeSlotsKey = `timeSlots${day.charAt(0).toUpperCase() + day.slice(1).toLowerCase()}`
    const timeSlots = newlySelectedSlots[timeSlotsKey]

    timeSlots.forEach((slot: string) => {
      const slotExists = sessionSlots.some(item => item.dayOfWeek === day && item.timeSlot === slot)

      if (!slotExists) {
        // Add missing slot with undefined start and finish times
        sessionSlots.push({
          dayOfWeek: day,
          timeSlot: slot as TimeSlot,
          start: undefined,
          finish: undefined,
        })
      }
    })
  })

  // We need to make sure that they're in the correct order
  const timeSlotOrder = {
    AM: 1,
    PM: 2,
    ED: 3,
  }

  const sortedSessionSlots = sessionSlots.sort((a, b) => {
    if (a.dayOfWeek < b.dayOfWeek) return -1
    if (a.dayOfWeek > b.dayOfWeek) return 1
    // If the day is the same, sort by the time slot order
    return timeSlotOrder[a.timeSlot] - timeSlotOrder[b.timeSlot]
  })

  return sortedSessionSlots
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
  if (
    pmSlotStartTime !== undefined &&
    customSlot.timeSlot === TimeSlot.ED &&
    customSlot.customStartTime.localeCompare(pmSlotStartTime) <= 0
  ) {
    return true
  }
  return false
}

export default class SessionTimesRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const regimeTimes = await this.activitiesService.getPrisonRegime(user.activeCaseLoadId, user)
    const { activityId, slots } = req.session.createJourney

    const sessionSlots = await this.getDaysAndSlots(
      regimeTimes,
      slots['1'],
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
          `endTimes-${customSlot.daysOfWeek}-${customSlot.timeSlot}`,
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
          `startTimes-${customSlot.daysOfWeek}-${customSlot.timeSlot}`,
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

  private getDaysAndSlots = async (
    regimeTimes: PrisonRegime[],
    slots: Slots,
    editModeActive: boolean,
    activityId: number,
    user: ServiceUser,
  ): Promise<DaysAndSlotsInRegime[]> => {
    if (editModeActive) {
      const activity = await this.activitiesService.getActivity(activityId, user)
      const activitySchedule = activity.schedules[0]
      const existingSlots = transformActivitySlotsToDailySlots(activitySchedule.slots)
      const sessionSlots = createSessionSlots(existingSlots)
      return addNewEmptySlotsIfRequired(sessionSlots, slots)
    }
    const applicableRegimeTimesForActivity: DaysAndSlotsInRegime[] = getApplicableDaysAndSlotsInRegime(
      regimeTimes,
      slots,
    )
    return createSessionSlots(applicableRegimeTimesForActivity)
  }
}
