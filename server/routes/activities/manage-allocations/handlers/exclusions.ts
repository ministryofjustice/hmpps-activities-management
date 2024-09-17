import { Request, Response } from 'express'
import { Expose, Transform, Type } from 'class-transformer'
import ActivitiesService from '../../../../services/activitiesService'
import { parseDate } from '../../../../utils/utils'
import calcCurrentWeek from '../../../../utils/helpers/currentWeekCalculator'
import TimeSlot from '../../../../enum/timeSlot'
import {
  DayOfWeek,
  DayOfWeekEnum,
  calculateUniqueSlots,
  mapActivityScheduleSlotsToSlots,
  sessionSlotsToSchedule,
  WeeklyCustomTimeSlots,
} from '../../../../utils/helpers/activityTimeSlotMappers'
import { Slot } from '../../../../@types/activitiesAPI/types'

class Slots {
  @Expose()
  @Transform(({ value }) => (value ? [value].flat() : [])) // Transform to an array if only one value is provided
  monday: TimeSlot[]

  @Expose()
  @Transform(({ value }) => (value ? [value].flat() : [])) // Transform to an array if only one value is provided
  tuesday: TimeSlot[]

  @Expose()
  @Transform(({ value }) => (value ? [value].flat() : [])) // Transform to an array if only one value is provided
  wednesday: TimeSlot[]

  @Expose()
  @Transform(({ value }) => (value ? [value].flat() : [])) // Transform to an array if only one value is provided
  thursday: TimeSlot[]

  @Expose()
  @Transform(({ value }) => (value ? [value].flat() : [])) // Transform to an array if only one value is provided
  friday: TimeSlot[]

  @Expose()
  @Transform(({ value }) => (value ? [value].flat() : [])) // Transform to an array if only one value is provided
  saturday: TimeSlot[]

  @Expose()
  @Transform(({ value }) => (value ? [value].flat() : [])) // Transform to an array if only one value is provided
  sunday: TimeSlot[]
}

export class Schedule {
  @Expose()
  @Type(() => Slots)
  week1: Slots

  @Expose()
  @Type(() => Slots)
  week2: Slots
}

export default class ExclusionRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { activity, exclusions, inmate } = req.session.allocateJourney

    const activitySchedule = await this.activitiesService.getActivitySchedule(activity.scheduleId, user)

    const weeklySchedule = sessionSlotsToSchedule(activitySchedule.scheduleWeeks, activitySchedule.slots)

    const currentWeekNumber = calcCurrentWeek(parseDate(activitySchedule.startDate), activitySchedule.scheduleWeeks)

    const weeks = []

    const weekDaysUsed = this.getAllWeekDaysUsed(weeklySchedule)

    for (let i = 0; i < activitySchedule.scheduleWeeks; i += 1) {
      const weekNumber = i + 1
      const currentWeek = weekNumber === currentWeekNumber

      const weekDays = weeklySchedule[weekNumber]
        .filter(weekDay => weekDaysUsed.has(weekDay.day))
        .map(weekDay => {
          const { day } = weekDay
          const slots = weekDay.slots.map(slot => {
            const excluded =
              exclusions.filter(
                exclusion =>
                  exclusion.weekNumber === weekNumber &&
                  exclusion.timeSlot === slot.timeSlot &&
                  exclusion[day.toLowerCase()],
              ).length > 0

            return {
              ...slot,
              excluded,
            }
          })
          return { day, slots }
        })

      weeks.push({
        weekNumber,
        currentWeek,
        weekDays,
      })
    }

    res.render('pages/activities/manage-allocations/exclusions', {
      prisonerName: inmate.prisonerName,
      weeks,
    })
  }

  /**
   * Get a list of all weekdays used across all weeks. For example if Monday is in week 1 and Wednesday is in week 2
   * then we return a list containing Monday and Wednesday
   * @param weeklySchedule The weekly schedule
   * @returns The set of days, e.g. ['Monday', 'Wednesday']
   */
  private getAllWeekDaysUsed(weeklySchedule: WeeklyCustomTimeSlots): Set<string> {
    const weekDaysUsed: Set<string> = new Set<string>()

    Object.values(weeklySchedule).forEach(week =>
      week.forEach(weekDay => {
        if (weekDay.slots.length > 0) {
          weekDaysUsed.add(weekDay.day)
        }
      }),
    )

    return weekDaysUsed
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { mode } = req.params
    const { activity } = req.session.allocateJourney

    const schedule = await this.activitiesService.getActivitySchedule(activity.scheduleId, user)
    const slots = mapActivityScheduleSlotsToSlots(schedule.slots)
    const updatedSlots = this.mapBodyToSlots(req.body)

    const updatedExclusions = calculateUniqueSlots(slots, updatedSlots)
    req.session.allocateJourney.updatedExclusions = updatedExclusions

    if (mode === 'create') {
      return res.redirect('check-answers')
    }

    return res.redirect('confirm-exclusions')
  }

  private mapBodyToSlots(body: Schedule): Slot[] {
    const convertTimeSlotToSlot = (weekNumber: number, daysOfWeek: DayOfWeek[], timeSlot: TimeSlot): Slot => ({
      weekNumber,
      timeSlot: TimeSlot[timeSlot.toUpperCase()],
      daysOfWeek,
      monday: daysOfWeek.includes(DayOfWeekEnum.MONDAY),
      tuesday: daysOfWeek.includes(DayOfWeekEnum.TUESDAY),
      wednesday: daysOfWeek.includes(DayOfWeekEnum.WEDNESDAY),
      thursday: daysOfWeek.includes(DayOfWeekEnum.THURSDAY),
      friday: daysOfWeek.includes(DayOfWeekEnum.FRIDAY),
      saturday: daysOfWeek.includes(DayOfWeekEnum.SATURDAY),
      sunday: daysOfWeek.includes(DayOfWeekEnum.SUNDAY),
    })

    // Iterate over week1 and week2 in the Schedule object
    return ['week1', 'week2']
      .flatMap((weekKey, weekIndex) => {
        const week: Slots = body[weekKey]

        return week
          ? Object.values(TimeSlot).map(timeSlot => {
              const days = Object.entries(week)
                .map(([day, slots]) => (slots.includes(timeSlot) ? day : null))
                .filter(day => Boolean(day))
                .map(day => day.toUpperCase())

              return convertTimeSlotToSlot(weekIndex + 1, days as DayOfWeek[], <TimeSlot>timeSlot)
            })
          : undefined
      })
      .filter(s => s?.daysOfWeek?.length > 0)
  }
}
