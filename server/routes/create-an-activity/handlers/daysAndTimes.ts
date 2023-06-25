import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty, ValidateIf } from 'class-validator'
import { mapSlots } from '../../../utils/utils'
import { ActivityUpdateRequest } from '../../../@types/activitiesAPI/types'
import ActivitiesService from '../../../services/activitiesService'

export class DaysAndTimes {
  @Expose()
  @IsNotEmpty({ message: 'Select at least one day' })
  days: string[]

  @Expose()
  @ValidateIf(o => o.days && o.days.includes('monday'))
  @IsNotEmpty({ message: 'Select at least one time slot for Monday' })
  timeSlotsMonday: string[]

  @Expose()
  @ValidateIf(o => o.days && o.days.includes('tuesday'))
  @IsNotEmpty({ message: 'Select at least one time slot for Tuesday' })
  timeSlotsTuesday: string[]

  @Expose()
  @ValidateIf(o => o.days && o.days.includes('wednesday'))
  @IsNotEmpty({ message: 'Select at least one time slot for Wednesday' })
  timeSlotsWednesday: string[]

  @Expose()
  @ValidateIf(o => o.days && o.days.includes('thursday'))
  @IsNotEmpty({ message: 'Select at least one time slot for Thursday' })
  timeSlotsThursday: string[]

  @Expose()
  @ValidateIf(o => o.days && o.days.includes('friday'))
  @IsNotEmpty({ message: 'Select at least one time slot for Friday' })
  timeSlotsFriday: string[]

  @Expose()
  @ValidateIf(o => o.days && o.days.includes('saturday'))
  @IsNotEmpty({ message: 'Select at least one time slot for Saturday' })
  timeSlotsSaturday: string[]

  @Expose()
  @ValidateIf(o => o.days && o.days.includes('sunday'))
  @IsNotEmpty({ message: 'Select at least one time slot for Sunday' })
  timeSlotsSunday: string[]
}

export default class DaysAndTimesRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/create-an-activity/days-and-times')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    function sanitizeTimeSlots(timeSlots: string | string[]): string[] {
      let result
      if (typeof timeSlots === 'string') {
        result = [timeSlots]
      } else if (Array.isArray(timeSlots)) {
        result = [...timeSlots]
      }
      return result
    }

    if (typeof req.body.days === 'string') {
      req.session.createJourney.days = [req.body.days]
    } else if (Array.isArray(req.body.days)) {
      req.session.createJourney.days = [...req.body.days]
    } else {
      req.session.createJourney.days = undefined
    }

    req.session.createJourney.timeSlotsMonday = sanitizeTimeSlots(req.body.timeSlotsMonday)
    req.session.createJourney.timeSlotsTuesday = sanitizeTimeSlots(req.body.timeSlotsTuesday)
    req.session.createJourney.timeSlotsWednesday = sanitizeTimeSlots(req.body.timeSlotsWednesday)
    req.session.createJourney.timeSlotsThursday = sanitizeTimeSlots(req.body.timeSlotsThursday)
    req.session.createJourney.timeSlotsFriday = sanitizeTimeSlots(req.body.timeSlotsFriday)
    req.session.createJourney.timeSlotsSaturday = sanitizeTimeSlots(req.body.timeSlotsSaturday)
    req.session.createJourney.timeSlotsSunday = sanitizeTimeSlots(req.body.timeSlotsSunday)
    if (req.query && req.query.fromEditActivity) {
      const { user } = res.locals
      const { activityId } = req.session.createJourney
      const prisonCode = user.activeCaseLoadId
      const slots = mapSlots(req.session.createJourney)
      const activity = {
        slots,
      } as ActivityUpdateRequest
      await this.activitiesService.updateActivity(prisonCode, activityId, activity)
      const successMessage = `We've updated the daily schedule for ${req.session.createJourney.name}`

      const returnTo = `/activities/schedule/activities/${req.session.createJourney.activityId}`
      req.session.returnTo = returnTo
      res.redirectOrReturnWithSuccess(returnTo, 'Activity updated', successMessage)
    } else res.redirectOrReturn('bank-holiday-option')
  }
}
