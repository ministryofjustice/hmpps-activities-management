import { Request, Response } from 'express'
import { ValidateNested } from 'class-validator'
import { plainToInstance, Transform } from 'class-transformer'
import ActivitiesService from '../../../../services/activitiesService'
import getApplicableDaysAndSlotsInRegime, {
  DaysAndSlotsInRegime,
} from '../../../../utils/helpers/applicableRegimeTimeUtil'
import { Slots } from '../journey'
import { Slot } from '../../../../@types/activitiesAPI/types'
import TimeSlot from '../../../../enum/timeSlot'
import SimpleTime from '../../../../commonValidationTypes/simpleTime'
import { createCustomSlots } from '../../../../utils/helpers/activityTimeSlotMappers'

type SessionSlot = {
  dayOfWeek: string
  timeSlot: TimeSlot
  start: string
  finish: string
  isFirst: boolean
}
export class SessionTimes {
  // validate sessions (do not overlap???)
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
        isFirst: true,
      })
    }
    if (day.pmStart) {
      sessionSlots.push({
        dayOfWeek: day.dayOfWeek,
        timeSlot: TimeSlot.PM,
        start: day.pmStart,
        finish: day.pmFinish,
        isFirst: !day.amStart,
      })
    }
    if (day.edStart) {
      sessionSlots.push({
        dayOfWeek: day.dayOfWeek,
        timeSlot: TimeSlot.ED,
        start: day.edStart,
        finish: day.edFinish,
        isFirst: !day.amStart && !day.pmStart,
      })
    }
  })

  return sessionSlots
}

function startDateBeforeEarlierSession(customSlot: Slot, allSlots: Slot[]): boolean {
  if (customSlot.timeSlot === TimeSlot.AM) {
    return false
  }
  const amSlotStartTime: string = allSlots.find(
    slot => slot.timeSlot === TimeSlot.AM && slot.daysOfWeek[0] === customSlot.daysOfWeek[0],
  )?.customStartTime

  const pmSlotStartTime: string = allSlots.find(
    slot => slot.timeSlot === TimeSlot.PM && slot.daysOfWeek[0] === customSlot.daysOfWeek[0],
  )?.customStartTime

  if (
    (amSlotStartTime !== undefined &&
      customSlot.timeSlot === TimeSlot.PM &&
      customSlot.customStartTime.localeCompare(amSlotStartTime) <= 0) ||
    (amSlotStartTime !== undefined &&
      customSlot.timeSlot === TimeSlot.ED &&
      customSlot.customStartTime.localeCompare(amSlotStartTime) <= 0) ||
    (pmSlotStartTime !== undefined &&
      customSlot.timeSlot === TimeSlot.ED &&
      customSlot.customStartTime.localeCompare(pmSlotStartTime) <= 0)
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

    // TODO: the week will have to be passed through from previous pages once we do split regimes, rather than hardcoded as ['1']
    const slots: Slots = req.session.createJourney.slots['1']

    const applicableRegimeTimesForActivity: DaysAndSlotsInRegime[] = getApplicableDaysAndSlotsInRegime(
      regimeTimes,
      slots,
    )

    const sessionSlots: SessionSlot[] = createSessionSlots(applicableRegimeTimesForActivity)

    res.render(`pages/activities/create-an-activity/session-times`, {
      regimeTimes: applicableRegimeTimesForActivity,
      sessionSlots,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { startTimes, endTimes }: SessionTimes = req.body

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

    const slotsWithStartBeforeEarlierSession: Slot[] = customSlots.filter((customSlot: Slot) =>
      startDateBeforeEarlierSession(customSlot, customSlots),
    )
    if (slotsWithStartBeforeEarlierSession.length > 0) {
      slotsWithStartBeforeEarlierSession.forEach(customSlot => {
        res.addValidationError(
          `startTimes-${customSlot.daysOfWeek}-${customSlot.timeSlot}`,
          'Start time must be after the earlier session start time',
        )
      })
      return res.validationFailed()
    }

    req.session.createJourney.customSlots = customSlots
    return res.redirectOrReturn(`location`)
  }
}
