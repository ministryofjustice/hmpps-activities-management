import { Request, Response } from 'express'
import { ValidateNested } from 'class-validator'
import { Transform, plainToInstance } from 'class-transformer'
import ActivitiesService from '../../../../services/activitiesService'
import getApplicableDaysAndSlotsInRegime from '../../../../utils/helpers/applicableRegimeTimeUtil'
import { Slots } from '../journey'
import { journeySlotsToCustomSlots } from '../../../../utils/helpers/activityTimeSlotMappers'
import { Slot } from '../../../../@types/activitiesAPI/types'
import TimeSlot from '../../../../enum/timeSlot'
import SimpleTime from '../../../../commonValidationTypes/simpleTime'

export class SessionTimes {
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

export default class SessionTimesRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const regimeTimes = await this.activitiesService.getPrisonRegime(user.activeCaseLoadId, user)

    // TODO: the week will have to be passed through from previous pages once we do split regimes, rather than hardcoded as ['1']
    const slots: Slots = req.session.createJourney.slots['1']
    // TODO: implement real custom slots
    const customSlots: Slot[] = journeySlotsToCustomSlots(slots)

    const applicableRegimeTimesForActivity = getApplicableDaysAndSlotsInRegime(regimeTimes, slots)

    const sessionSlots: { dayOfWeek: string; timeSlot: TimeSlot; start: string; finish: string; isFirst: boolean }[] =
      []

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

    res.render(`pages/activities/create-an-activity/session-times`, {
      regimeTimes: applicableRegimeTimesForActivity,
      customSlots,
      sessionSlots,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { startTime, endTime }: SessionTimes = req.body

    const startTimeObj = Array.from(startTime.keys()).reduce((acc, value) => {
      acc[value] = startTime.get(value)
      return value
    })

    const endTimeObj = Array.from(endTime.keys()).reduce((acc, value) => {
      acc[value] = endTime.get(value)
      return value
    })

    req.body.startTime = startTimeObj
    req.body.endTime = endTimeObj

    // const customSlots = req.session.createJourney.customSlots.map(customSlot => ({
    //   customStartTime: startTimeObj,
    //   customEndTime: endTimeObj,
    //   daysOfWeek: customSlot.daysOfWeek,
    //   friday: customSlot.friday,
    //   monday: customSlot.monday,
    //   saturday: customSlot.saturday,
    //   sunday: customSlot.sunday,
    //   thursday: customSlot.thursday,
    //   timeSlot: customSlot.timeSlot,
    //   tuesday: customSlot.tuesday,
    //   wednesday: customSlot.wednesday,
    //   weekNumber: 1,
    // }))
    // // const { customSlots } = req.body
    // req.session.createJourney.customSlots = customSlots
    res.redirectOrReturn('location')
  }
}
