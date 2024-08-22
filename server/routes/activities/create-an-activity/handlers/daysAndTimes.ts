import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty, ValidateIf } from 'class-validator'
import createHttpError from 'http-errors'
import { NextFunction } from 'express-serve-static-core'
import { convertToArray, formatDate, mapJourneySlotsToActivityRequest } from '../../../../utils/utils'
import { ActivityUpdateRequest } from '../../../../@types/activitiesAPI/types'
import ActivitiesService from '../../../../services/activitiesService'
import calcCurrentWeek from '../../../../utils/helpers/currentWeekCalculator'
import { parseIsoDate } from '../../../../utils/datePickerUtils'
import { validateSlotChanges } from '../../../../utils/helpers/activityScheduleValidator'
import { CreateAnActivityJourney } from '../journey'
import config from '../../../../config'

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

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default class DaysAndTimesRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { scheduleWeeks, startDate } = req.session.createJourney
    const { weekNumber } = req.params

    if (!this.validateWeekNumber(weekNumber, scheduleWeeks)) return next(createHttpError.NotFound())

    const currentWeek = calcCurrentWeek(parseIsoDate(startDate), scheduleWeeks)

    return res.render('pages/activities/create-an-activity/days-and-times', { currentWeek })
  }

  POST = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { scheduleWeeks } = req.session.createJourney
    const { weekNumber } = req.params
    const selectedDays = req.body.days
    const { preserveHistory, fromScheduleFrequency } = req.query

    if (!this.validateWeekNumber(weekNumber, scheduleWeeks)) return next(createHttpError.NotFound())

    req.session.createJourney.slots ??= {}

    const { slots } = req.session.createJourney
    const weekNumberInt = +weekNumber

    if (!selectedDays) {
      const updatedSlots = { ...slots }
      updatedSlots[weekNumberInt] = { days: [] }

      const hasDaysSelected = Object.values(updatedSlots).find(slot => slot?.days?.length > 0)
      if ((scheduleWeeks === weekNumberInt || preserveHistory) && !hasDaysSelected) {
        return res.validationFailed('days', 'You must select at least 1 slot across the schedule')
      }
      req.session.createJourney.slots = updatedSlots
    } else {
      const weeklySlots = this.getSessionSlots(req, weekNumberInt)

      weeklySlots.days = convertToArray(selectedDays)

      const sanitizeTimeSlots = (timeSlots: string | string[]): string[] => {
        if (typeof timeSlots === 'string') return [timeSlots]
        if (Array.isArray(timeSlots)) return [...timeSlots]
        return []
      }

      daysOfWeek.forEach(day => {
        if (weeklySlots.days.find(selectedDay => selectedDay === day.toLowerCase())) {
          weeklySlots[`timeSlots${day}`] = sanitizeTimeSlots(req.body[`timeSlots${day}`])
        } else {
          weeklySlots[`timeSlots${day}`] = []
        }
      })
    }

    if (this.findSlotErrors(req.session.createJourney, weekNumberInt, res)) {
      return res.validationFailed()
    }

    if (scheduleWeeks === weekNumberInt) {
      // If create journey, redirect to next journey page
      if (!preserveHistory) return res.redirect('../bank-holiday-option')
      // If from edit page, edit slots
      if (req.params.mode === 'edit') {
        const activity = await this.activitiesService.getActivity(
          +req.session.createJourney.activityId,
          res.locals.user,
        )
        const { usePrisonRegimeTime } = activity.schedules[0]
        if (config.customStartEndTimesEnabled && !usePrisonRegimeTime) {
          return res.redirect('../session-times')
        }
        return this.editSlots(req, res)
      }
      return res.redirect('../check-answers')
    }
    if (preserveHistory && !fromScheduleFrequency) {
      // If this is a week-specific slot edit (not from schedule frequency page)
      if (req.params.mode === 'edit') return this.editSlots(req, res)
      return res.redirect('../check-answers')
    }

    let redirectParams = ''
    if (preserveHistory) {
      redirectParams += `?preserveHistory=true`
      redirectParams += fromScheduleFrequency ? `&fromScheduleFrequency=true` : ''
    }

    return res.redirect(`${weekNumberInt + 1}${redirectParams}`)
  }

  private async editSlots(req: Request, res: Response) {
    const { user } = res.locals
    const { activityId, scheduleWeeks } = req.session.createJourney
    const slots = mapJourneySlotsToActivityRequest(req.session.createJourney.slots)
    const activity = {
      slots,
      scheduleWeeks,
    } as ActivityUpdateRequest
    await this.activitiesService.updateActivity(activityId, activity, user)
    const successMessage = `You've updated the daily schedule for ${req.session.createJourney.name}`

    const returnTo = `/activities/view/${req.session.createJourney.activityId}`
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

  private findSlotErrors(journey: CreateAnActivityJourney, weekNumber: number, res: Response): boolean {
    const errors = validateSlotChanges(journey, weekNumber)

    if (errors.length === 0) {
      return false
    }

    const activityStartDate = formatDate(journey.startDate)
    const activityEndDate = formatDate(journey.endDate)

    errors.forEach(error => {
      let message
      if (journey.scheduleWeeks === 1) {
        message = `You cannot select ${error.day}. This is because the activity starts on ${activityStartDate} and ends on ${activityEndDate}`
      } else {
        message = `You cannot select ${error.day}. As this activity starts on ${activityStartDate} and ends on ${activityEndDate}, there cannot be a ${error.day} session in week ${weekNumber}`
      }
      res.addValidationError(`timeSlots${error.day}`, message)
    })

    return true
  }
}
