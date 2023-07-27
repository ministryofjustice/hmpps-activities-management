import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty, ValidateIf } from 'class-validator'
import createHttpError from 'http-errors'
import { NextFunction } from 'express-serve-static-core'
import { mapSlots } from '../../../../utils/utils'
import { ActivityUpdateRequest } from '../../../../@types/activitiesAPI/types'
import ActivitiesService from '../../../../services/activitiesService'

export class DaysAndTimes {
  @Expose()
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

  GET = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { scheduleWeeks } = req.session.createJourney
    const { weekNumber } = req.params

    if (!this.validateWeekNumber(weekNumber, scheduleWeeks)) return next(createHttpError.NotFound())

    return res.render('pages/activities/create-an-activity/days-and-times')
  }

  POST = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { scheduleWeeks } = req.session.createJourney
    const { weekNumber } = req.params
    const selectedDays = req.body.days
    const { preserveHistory, fromScheduleFrequency, fromEditActivity } = req.query

    if (!this.validateWeekNumber(weekNumber, scheduleWeeks)) return next(createHttpError.NotFound())

    req.session.createJourney.slots ??= {}

    const { slots } = req.session.createJourney
    const weekNumberInt = +weekNumber

    if (!selectedDays) {
      req.session.createJourney.slots[weekNumberInt] = { days: [] }
      const hasDaysSelected = Object.values(slots).find(slot => slot?.days?.length > 0)
      if ((scheduleWeeks === weekNumberInt || preserveHistory) && !hasDaysSelected)
        return res.validationFailed('days', 'You must select at least 1 slot across the schedule')
    } else {
      const weeklySlots = this.getSessionSlots(req, weekNumberInt)

      if (typeof selectedDays === 'string') {
        weeklySlots.days = [selectedDays]
      } else if (Array.isArray(selectedDays)) {
        weeklySlots.days = [...selectedDays]
      }

      const sanitizeTimeSlots = (timeSlots: string | string[]): string[] => {
        if (typeof timeSlots === 'string') return [timeSlots]
        if (Array.isArray(timeSlots)) return [...timeSlots]
        return []
      }

      const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      daysOfWeek.forEach(day => {
        if (weeklySlots.days.find(selectedDay => selectedDay === day.toLowerCase())) {
          weeklySlots[`timeSlots${day}`] = sanitizeTimeSlots(req.body[`timeSlots${day}`])
        } else {
          weeklySlots[`timeSlots${day}`] = []
        }
      })
    }

    if (scheduleWeeks === weekNumberInt) {
      // If create journey, redirect to next journey page
      if (!preserveHistory) return res.redirect('../bank-holiday-option')
      // If from edit page, edit slots
      if (fromEditActivity) return this.editSlots(req, res)
      return res.redirect('../check-answers')
    }
    if (preserveHistory && !fromScheduleFrequency) {
      // If this is a week-specfic slot edit (not from schedule frequency page)
      if (fromEditActivity) return this.editSlots(req, res)
      return res.redirect('../check-answers')
    }

    let redirectParams = ''
    if (preserveHistory) {
      redirectParams += `?preserveHistory=true`
      redirectParams += fromScheduleFrequency ? `&fromScheduleFrequency=true` : ''
      redirectParams += fromEditActivity ? `&fromEditActivity=true` : ''
    }

    return res.redirect(`${weekNumberInt + 1}${redirectParams}`)
  }

  private async editSlots(req: Request, res: Response) {
    const { user } = res.locals
    const { activityId, scheduleWeeks } = req.session.createJourney
    const slots = mapSlots(req.session.createJourney)
    const activity = {
      slots,
      scheduleWeeks,
    } as ActivityUpdateRequest
    await this.activitiesService.updateActivity(user.activeCaseLoadId, activityId, activity)
    const successMessage = `We've updated the daily schedule for ${req.session.createJourney.name}`

    const returnTo = `/activities/schedule/activities/${req.session.createJourney.activityId}`
    req.session.returnTo = returnTo
    res.redirectOrReturnWithSuccess(returnTo, 'Activity updated', successMessage)
  }

  private getSessionSlots = (req: Request, weekNumber: number) => {
    req.session.createJourney.slots ??= {}
    req.session.createJourney.slots[weekNumber] ??= {
      days: [],
    }
    return req.session.createJourney.slots[weekNumber]
  }

  private validateWeekNumber = (weekNumber: string, scheduleWeeks: number) => {
    // Week number should be a positive whole number, less or equal to the schedule weeks
    const weekNumberInt = Math.floor(+weekNumber)
    if (!+weekNumber || !scheduleWeeks) return false
    if (weekNumberInt !== +weekNumber) return false
    if (weekNumberInt <= 0 || weekNumberInt > scheduleWeeks) return false
    return true
  }
}
