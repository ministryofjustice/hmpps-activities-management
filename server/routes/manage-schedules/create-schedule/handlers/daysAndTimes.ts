import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty, ValidateIf } from 'class-validator'

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
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/manage-schedules/create-schedule/days-and-times')
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
      req.session.createScheduleJourney.days = [req.body.days]
    } else if (Array.isArray(req.body.days)) {
      req.session.createScheduleJourney.days = [...req.body.days]
    } else {
      req.session.createScheduleJourney.days = undefined
    }

    req.session.createScheduleJourney.timeSlotsMonday = sanitizeTimeSlots(req.body.timeSlotsMonday)
    req.session.createScheduleJourney.timeSlotsTuesday = sanitizeTimeSlots(req.body.timeSlotsTuesday)
    req.session.createScheduleJourney.timeSlotsWednesday = sanitizeTimeSlots(req.body.timeSlotsWednesday)
    req.session.createScheduleJourney.timeSlotsThursday = sanitizeTimeSlots(req.body.timeSlotsThursday)
    req.session.createScheduleJourney.timeSlotsFriday = sanitizeTimeSlots(req.body.timeSlotsFriday)
    req.session.createScheduleJourney.timeSlotsSaturday = sanitizeTimeSlots(req.body.timeSlotsSaturday)
    req.session.createScheduleJourney.timeSlotsSunday = sanitizeTimeSlots(req.body.timeSlotsSunday)
    res.redirectOrReturn('location')
  }
}
