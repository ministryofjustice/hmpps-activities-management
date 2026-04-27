import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty, ValidateIf } from 'class-validator'
import createHttpError from 'http-errors'
import { NextFunction } from 'express-serve-static-core'
import {
  convertToArray,
  DAYS_OF_WEEK,
  formatDate,
  mapJourneySlotsToActivityRequest,
  parseDate,
} from '../../../../utils/utils'
import { ActivityUpdateRequest, Slot } from '../../../../@types/activitiesAPI/types'
import ActivitiesService from '../../../../services/activitiesService'
import calcCurrentWeek from '../../../../utils/helpers/currentWeekCalculator'
import { parseIsoDate } from '../../../../utils/datePickerUtils'
import { validateSlotChanges } from '../../../../utils/helpers/activityScheduleValidator'
import {
  calculateUniqueSlots,
  DayOfWeek,
  DayOfWeekEnum,
  mapActivityScheduleSlotsToSlots,
  mergeExclusionSlots,
} from '../../../../utils/helpers/activityTimeSlotMappers'
import { CreateAnActivityJourney, ScheduleFrequency, Slots } from '../journey'
import getFutureSameDaySlots from '../../../../utils/helpers/futureSameDaySlots'
import config from '../../../../config'
import TimeSlot from '../../../../enum/timeSlot'

export class DaysAndSessions {
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

export default class DaysAndSessionsRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { scheduleWeeks, startDate, scheduleId, baselineSlots } = req.journeyData.createJourney
    const { sameDayScheduleModificationsEnabled } = config
    const { weekNumber } = req.params as { weekNumber: string }

    // Store existing activity slots, which will be used to compare against user changes for same-day validation
    if (sameDayScheduleModificationsEnabled && !baselineSlots) {
      const schedule = await this.activitiesService.getActivitySchedule(scheduleId, res.locals.user)
      const mappedSlots = mapActivityScheduleSlotsToSlots(schedule.slots)
      req.journeyData.createJourney.baselineSlots = mergeExclusionSlots(mappedSlots)
    }

    if (!this.validateWeekNumber(weekNumber, scheduleWeeks)) return next(createHttpError.NotFound())

    const currentWeek = calcCurrentWeek(parseIsoDate(startDate), scheduleWeeks)

    return res.render('pages/activities/create-an-activity/days-and-times', { currentWeek })
  }

  POST = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { scheduleWeeks } = req.journeyData.createJourney
    const { weekNumber } = req.params as { weekNumber: string }
    const selectedDaysForWeek = req.body.days
    const preserveHistoryBool = req.query.preserveHistory === 'true'
    const fromScheduleFrequencyBool = req.query.fromScheduleFrequency === 'true'

    if (!this.validateWeekNumber(weekNumber, scheduleWeeks)) return next(createHttpError.NotFound())

    req.journeyData.createJourney.slots ??= {}
    const { slots } = req.journeyData.createJourney
    const weekNumberInt = +weekNumber

    if (!selectedDaysForWeek) {
      const updatedSlots: { [p: string]: Slots } = { ...slots }
      updatedSlots[weekNumber] = { days: [] }

      const hasDaysSelected = Object.values(updatedSlots).find(slot => slot?.days?.length > 0)
      if ((scheduleWeeks === weekNumberInt || preserveHistoryBool) && !hasDaysSelected) {
        return res.validationFailed('days', 'You must select at least 1 slot across the schedule')
      }
      req.journeyData.createJourney.slots = updatedSlots
    } else {
      this.updateWeeklySlots(req, weekNumber.toString(), selectedDaysForWeek)
    }

    if (this.findSlotErrors(req.journeyData.createJourney, weekNumberInt, res)) {
      return res.validationFailed()
    }

    if (fromScheduleFrequencyBool && scheduleWeeks === ScheduleFrequency.BI_WEEKLY) {
      if (weekNumberInt === ScheduleFrequency.BI_WEEKLY) {
        const queryParams = preserveHistoryBool
          ? `?preserveHistory=true&fromScheduleFrequency=true`
          : '?fromScheduleFrequency=true'
        return res.redirect(`../session-times-option/${weekNumber}${queryParams}`)
      }
      return res.redirect(this.getRedirectUrl(weekNumberInt, preserveHistoryBool, fromScheduleFrequencyBool))
    }

    if (req.routeContext.mode === 'edit') {
      return this.editDaysAndSessions(req, res)
    }

    const queryParams = preserveHistoryBool ? `?preserveHistory=true` : ``

    if (scheduleWeeks === ScheduleFrequency.WEEKLY) {
      return res.redirect(`../session-times-option/${weekNumber}${queryParams}`)
    }
    if (scheduleWeeks === ScheduleFrequency.BI_WEEKLY) {
      if (weekNumberInt === ScheduleFrequency.BI_WEEKLY) {
        return res.redirect(`../session-times-option/${weekNumber}${queryParams}`)
      }
      return res.redirect(this.getRedirectUrl(weekNumberInt, preserveHistoryBool, fromScheduleFrequencyBool))
    }
    // redirect back to the activities page as we've lost the scheduleWeeks value
    return res.redirect('/activities')
  }

  private getRedirectUrl(weekNumber: number, preserveHistory: boolean, fromScheduleFrequencyBool: boolean) {
    let redirectParams = ''
    if (preserveHistory) {
      redirectParams += '?preserveHistory=true'
      redirectParams += fromScheduleFrequencyBool ? '&fromScheduleFrequency=true' : ''
    }
    return `${weekNumber + 1}${redirectParams}`
  }

  private async editDaysAndSessions(req: Request, res: Response) {
    const usingRegimeTimes = await this.onPrisonRegime(req, res)
    const { sameDayScheduleModificationsEnabled } = config

    if (!sameDayScheduleModificationsEnabled) {
      return usingRegimeTimes ? this.editSlots(req, res) : res.redirect('../session-times')
    }
    const { weekNumber } = req.params as { weekNumber: string }
    const weekNumberInt = +weekNumber
    const { scheduleId, startDate, baselineSlots } = req.journeyData.createJourney
    const allocationHasStarted = new Date() >= parseDate(startDate)

    if (usingRegimeTimes) {
      if (allocationHasStarted && req.routeContext.mode === 'edit') {
        let addedSlots: Slot[] = []
        const allSlots = this.mapBodyToSlots(req.body as DaysAndSessions, weekNumberInt)

        if (allSlots.length > 0) {
          const baselineForCurrentWeek = baselineSlots.filter(slot => slot.weekNumber === weekNumberInt)

          addedSlots = calculateUniqueSlots(allSlots, baselineForCurrentWeek)

          const schedule = await this.activitiesService.getActivitySchedule(scheduleId, res.locals.user)
          const futureSameDaySlots = getFutureSameDaySlots(addedSlots, schedule)

          if (futureSameDaySlots.length > 0) {
            req.journeyData.createJourney.futureSameDaySlots = futureSameDaySlots
            return res.redirect('../run-session-today')
          }
        }
      }

      return this.editSlots(req, res)
    }

    return res.redirect('../session-times')
  }

  private async onPrisonRegime(req: Request, res: Response) {
    const activity = await this.activitiesService.getActivity(
      +req.journeyData.createJourney.activityId,
      res.locals.user,
    )
    return activity.schedules[0].usePrisonRegimeTime
  }

  private async editSlots(req: Request, res: Response) {
    const { user } = res.locals
    const { activityId, scheduleWeeks } = req.journeyData.createJourney
    const slots = mapJourneySlotsToActivityRequest(req.journeyData.createJourney.slots)
    const activity = {
      slots,
      scheduleWeeks,
    } as ActivityUpdateRequest
    await this.activitiesService.updateActivity(activityId, activity, user)
    const successMessage = `You've updated the daily schedule for ${req.journeyData.createJourney.name}`
    const returnTo = `/activities/view/${req.journeyData.createJourney.activityId}`
    req.session.returnTo = returnTo
    res.redirectOrReturnWithSuccess(returnTo, 'Activity updated', successMessage)
  }

  private updateWeeklySlots(req: Request, weekNumber: string, selectedDays: string | string[]) {
    const weeklySlots: Slots = this.getSessionSlots(req, +weekNumber)

    weeklySlots.days = convertToArray(selectedDays)

    DAYS_OF_WEEK.forEach(day => {
      if (weeklySlots.days.find(selectedDay => selectedDay === day.toLowerCase())) {
        weeklySlots[`timeSlots${day}`] = convertToArray(req.body[`timeSlots${day}`])
      } else {
        weeklySlots[`timeSlots${day}`] = []
      }
    })
  }

  private getSessionSlots = (req: Request, weekNumber: number): Slots => {
    req.journeyData.createJourney.slots ??= {}
    req.journeyData.createJourney.slots[weekNumber] ??= {
      days: [],
    }
    return req.journeyData.createJourney.slots[weekNumber]
  }

  private validateWeekNumber = (weekNumber: string, scheduleWeeks: number) => {
    // Week number should be a positive whole number, less or equal to the schedule weeks
    const weekNumberInt = Math.floor(+weekNumber)
    if (!+weekNumber || !scheduleWeeks) return false
    if (weekNumberInt !== +weekNumber) return false
    return !(weekNumberInt <= 0 || weekNumberInt > scheduleWeeks)
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

  private mapBodyToSlots(body: DaysAndSessions, weekNumber: number): Slot[] {
    const slots: Slot[] = []
    const timeSlotMap = new Map<string, DayOfWeek[]>()

    DAYS_OF_WEEK.forEach(day => {
      // Only continue if day checkbox selected in body
      if (!body.days.includes(day.toLowerCase())) return

      const timeSlotsProp = `timeSlots${day}`
      let timeSlots = body[timeSlotsProp as keyof DaysAndSessions]

      if (timeSlots && !Array.isArray(timeSlots)) {
        timeSlots = [timeSlots]
      }

      if (Array.isArray(timeSlots)) {
        timeSlots.forEach(timeSlot => {
          const key = `${timeSlot}`
          const days = timeSlotMap.get(key) || []
          days.push(DayOfWeekEnum[day.toUpperCase() as keyof typeof DayOfWeekEnum])
          timeSlotMap.set(key, days)
        })
      }
    })

    timeSlotMap.forEach((daysOfWeek, timeSlot) => {
      slots.push({
        weekNumber,
        timeSlot: timeSlot as TimeSlot,
        monday: daysOfWeek.includes(DayOfWeekEnum.MONDAY),
        tuesday: daysOfWeek.includes(DayOfWeekEnum.TUESDAY),
        wednesday: daysOfWeek.includes(DayOfWeekEnum.WEDNESDAY),
        thursday: daysOfWeek.includes(DayOfWeekEnum.THURSDAY),
        friday: daysOfWeek.includes(DayOfWeekEnum.FRIDAY),
        saturday: daysOfWeek.includes(DayOfWeekEnum.SATURDAY),
        sunday: daysOfWeek.includes(DayOfWeekEnum.SUNDAY),
        daysOfWeek,
      })
    })

    return slots
  }
}
