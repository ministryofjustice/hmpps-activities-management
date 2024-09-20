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
import { CreateAnActivityJourney, ScheduleFrequency, Slots } from '../journey'

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
    const preserveHistoryBool = req.query.preserveHistory === 'true'
    const fromScheduleFrequencyBool = req.query.fromScheduleFrequency === 'true'

    if (!this.validateWeekNumber(weekNumber, scheduleWeeks)) return next(createHttpError.NotFound())

    req.session.createJourney.slots ??= {}
    const { slots } = req.session.createJourney
    const weekNumberInt = +weekNumber

    this.handleSelectedDays(req, slots, weekNumberInt, scheduleWeeks, selectedDays, preserveHistoryBool, res, next)

    if (this.findSlotErrors(req.session.createJourney, weekNumberInt, res)) {
      return res.validationFailed()
    }

    if (scheduleWeeks === ScheduleFrequency.WEEKLY) {
      return this.handleOneScheduledWeek(req, res, preserveHistoryBool, weekNumberInt)
    }
    if (scheduleWeeks === ScheduleFrequency.BI_WEEKLY) {
      return this.handleTwoScheduledWeeks(req, res, preserveHistoryBool, weekNumberInt, fromScheduleFrequencyBool)
    }

    // redirect back to the activities page as we've lost the scheduleWeeks value
    return res.redirect('/activities')
  }

  private async handleOneScheduledWeek(req: Request, res: Response, preserveHistory: boolean, weekNumber: number) {
    if (req.params.mode === 'edit') {
      return this.editDaysAndTimes(req, res)
    }

    const redirectUrl = `../session-times-option/${weekNumber}`
    if (preserveHistory) return res.redirect(`${redirectUrl}?preserveHistory=true`)
    return res.redirect(redirectUrl)
  }

  private async handleTwoScheduledWeeks(
    req: Request,
    res: Response,
    preserveHistory: boolean,
    weekNumber: number,
    fromScheduleFrequency: boolean,
  ) {
    if (fromScheduleFrequency) {
      if (weekNumber === ScheduleFrequency.BI_WEEKLY) {
        const queryParams = preserveHistory
          ? `?preserveHistory=true&fromScheduleFrequency=true`
          : '?fromScheduleFrequency=true'
        return res.redirect(`../session-times-option/${weekNumber}${queryParams}`)
      }
      return res.redirect(this.getRedirectUrl(weekNumber, preserveHistory, fromScheduleFrequency))
    }

    if (req.params.mode === 'edit') {
      return this.editDaysAndTimes(req, res)
    }

    if (weekNumber === ScheduleFrequency.BI_WEEKLY) {
      const queryParams = preserveHistory ? `?preserveHistory=true` : ''
      return res.redirect(`../session-times-option/${weekNumber}${queryParams}`)
    }
    return res.redirect(this.getRedirectUrl(weekNumber, preserveHistory, fromScheduleFrequency))
  }

  private getRedirectUrl(weekNumber: number, preserveHistory: boolean, fromScheduleFrequencyBool: boolean) {
    let redirectParams = ''
    if (preserveHistory) {
      redirectParams += '?preserveHistory=true'
      redirectParams += fromScheduleFrequencyBool ? '&fromScheduleFrequency=true' : ''
    }
    return `${weekNumber + 1}${redirectParams}`
  }

  // eslint-disable-next-line consistent-return
  private handleSelectedDays(
    req: Request,
    slots: { [key: number]: Slots },
    weekNumber: number,
    scheduleWeeks: number,
    selectedDays: string[],
    preserveHistory: boolean,
    res: Response,
    next: NextFunction,
  ) {
    if (!selectedDays) {
      const updatedSlots: { [p: string]: Slots } = { ...slots }
      updatedSlots[weekNumber] = { days: [] }

      const hasDaysSelected = Object.values(updatedSlots).find(slot => slot?.days?.length > 0)
      if ((scheduleWeeks === weekNumber || preserveHistory) && !hasDaysSelected) {
        return res.validationFailed('days', 'You must select at least 1 slot across the schedule')
      }
      req.session.createJourney.slots = updatedSlots
    } else {
      this.updateWeeklySlots(req, weekNumber.toString(), selectedDays)
    }
  }

  private async editDaysAndTimes(req: Request, res: Response) {
    const usingRegimeTimes = await this.onPrisonRegime(req, res)
    return usingRegimeTimes ? this.editSlots(req, res) : res.redirect('../session-times')
  }

  private async onPrisonRegime(req: Request, res: Response) {
    const activity = await this.activitiesService.getActivity(+req.session.createJourney.activityId, res.locals.user)
    return activity.schedules[0].usePrisonRegimeTime
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

  private updateWeeklySlots(req: Request, weekNumber: string, selectedDays: string | string[]) {
    const weeklySlots: Slots = this.getSessionSlots(req, +weekNumber)

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

  private getSessionSlots = (req: Request, weekNumber: number): Slots => {
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
