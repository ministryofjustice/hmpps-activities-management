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
  // validate start before end & sessions (do not overlap???)
  @Transform(({ value }) =>
    Object.keys(value).reduce((acc, k) => acc.set(k, plainToInstance(SimpleTime, value[k])), new Map()),
  )
  @ValidateNested()
  startTime: Map<string, SimpleTime>

  @Transform(({ value }) =>
    Object.keys(value).reduce((acc, k) => acc.set(k, plainToInstance(SimpleTime, value[k])), new Map()),
  )
  @ValidateNested()
  endTime: Map<string, SimpleTime>
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
    const { startTime, endTime }: SessionTimes = req.body

    const customSlots: Slot[] = createCustomSlots(startTime, endTime)
    req.session.createJourney.customSlots = customSlots

    res.redirectOrReturn('location')
  }
}
