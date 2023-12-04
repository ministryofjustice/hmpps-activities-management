import { Request, Response } from 'express'
import { Expose, Transform, Type } from 'class-transformer'
import ActivitiesService from '../../../../services/activitiesService'
import { parseDate } from '../../../../utils/utils'
import calcCurrentWeek from '../../../../utils/helpers/currentWeekCalculator'
import TimeSlot from '../../../../enum/timeSlot'
import {
  DayOfWeek,
  calculateUniqueSlots,
  mapActivityScheduleSlotsToSlots,
  mapSlotsToDailyTimeSlots,
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

    const schedule = await this.activitiesService.getActivitySchedule(activity.scheduleId, user)
    const slots = mapActivityScheduleSlotsToSlots(schedule.slots)
    const dailySlots = mapSlotsToDailyTimeSlots(slots)

    res.render('pages/activities/manage-allocations/exclusions', {
      prisonerName: inmate.prisonerName,
      scheduleWeeks: schedule.scheduleWeeks,
      currentWeek: calcCurrentWeek(parseDate(schedule.startDate), schedule.scheduleWeeks),
      dailySlots,
      exclusions,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { mode } = req.params
    const { activity } = req.session.allocateJourney

    const schedule = await this.activitiesService.getActivitySchedule(activity.scheduleId, user)
    const slots = mapActivityScheduleSlotsToSlots(schedule.slots)
    const updatedSlots = this.mapBodyToSlots(req.body)

    if (updatedSlots.length === 0) {
      return res.validationFailed('slots', 'Select at least one session')
    }

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
      timeSlot: timeSlot.toUpperCase(),
      daysOfWeek,
      monday: daysOfWeek.includes('MONDAY'),
      tuesday: daysOfWeek.includes('TUESDAY'),
      wednesday: daysOfWeek.includes('WEDNESDAY'),
      thursday: daysOfWeek.includes('THURSDAY'),
      friday: daysOfWeek.includes('FRIDAY'),
      saturday: daysOfWeek.includes('SATURDAY'),
      sunday: daysOfWeek.includes('SUNDAY'),
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
