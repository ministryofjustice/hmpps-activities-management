import { Request, Response } from 'express'
import { Expose, Transform, Type } from 'class-transformer'
import ActivitiesService from '../../../../services/activitiesService'
import { parseDate } from '../../../../utils/utils'
import calcCurrentWeek from '../../../../utils/helpers/currentWeekCalculator'
import TimeSlot from '../../../../enum/timeSlot'
import { mapActivityScheduleSlotsToSlots } from '../../../../utils/helpers/activityTimeSlotMappers'
import { AllocationUpdateRequest, Slot } from '../../../../@types/activitiesAPI/types'

type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'

interface DailyTimeSlots {
  day: string
  weeks: {
    weekNumber: number
    slots: TimeSlot[]
  }[]
}

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
    const dailySlots = this.mapSlotsToDailyTimeSlots(slots)

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
    const { mode, allocationId } = req.params
    const { activity, inmate } = req.session.allocateJourney

    const schedule = await this.activitiesService.getActivitySchedule(activity.scheduleId, user)
    const slots = mapActivityScheduleSlotsToSlots(schedule.slots)
    const updatedSlots = this.mapBodyToSlots(req.body)

    if (updatedSlots.length === 0) {
      return res.validationFailed('slots', 'Select at least one session')
    }

    const updatedExclusions = this.calculateExclusions(slots, updatedSlots)
    req.session.allocateJourney.updatedExclusions = updatedExclusions

    if (mode === 'create') {
      return res.redirect('check-answers')
    }

    const allocation = { exclusions: updatedExclusions } as AllocationUpdateRequest

    await this.activitiesService.updateAllocation(user.activeCaseLoadId, +allocationId, allocation)

    if (mode === 'edit') {
      const successMessage = `You've updated the exclusions for this allocation`
      return res.redirectWithSuccess(
        `/activities/allocations/view/${allocationId}`,
        'Allocation updated',
        successMessage,
      )
    }

    // mode === 'exclude'
    return res.redirectWithSuccess(
      `/activities/exclusions/prisoner/${inmate.prisonerNumber}`,
      `You have updated when ${inmate.prisonerName} should attend ${activity.name}`,
    )
  }

  private mapSlotsToDailyTimeSlots(slots: Slot[]): DailyTimeSlots[] {
    const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

    // Group slots by day
    const slotsByDay: { [key: string]: Slot[] } = {}
    daysOfWeek.forEach(day => {
      slotsByDay[day] = slots.filter(slot => slot[day.toLowerCase()])
    })

    // Find the maximum number of weeks among all days
    const maxWeeks = Math.max(...Object.values(slotsByDay).flatMap(s => s.map(slot => slot.weekNumber)), 0)

    // Create DailyTimeSlots for each day
    return daysOfWeek
      .map(day => ({
        day,
        weeks: Array.from({ length: maxWeeks }, (_, index) => {
          const weekNumber = index + 1
          const timeSlots = (slotsByDay[day] || [])
            .filter(slot => slot.weekNumber === weekNumber)
            .map(slot => slot.timeSlot)

          return {
            weekNumber,
            slots: (timeSlots || []) as TimeSlot[], // Ensure slots is an empty array if no slots are found
          }
        }),
      }))
      .filter(dts => dts.weeks.some(w => w.slots.length > 0))
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

  private calculateExclusions(slots: Slot[], updatedSlots: Slot[]): Slot[] {
    return slots
      .map(slot => {
        const updatedSlot = updatedSlots.find(us => us.weekNumber === slot.weekNumber && us.timeSlot === slot.timeSlot)
        return updatedSlot
          ? {
              ...slot,
              monday: slot.monday && !updatedSlot.monday,
              tuesday: slot.tuesday && !updatedSlot.tuesday,
              wednesday: slot.wednesday && !updatedSlot.wednesday,
              thursday: slot.thursday && !updatedSlot.thursday,
              friday: slot.friday && !updatedSlot.friday,
              saturday: slot.saturday && !updatedSlot.saturday,
              sunday: slot.sunday && !updatedSlot.sunday,
              daysOfWeek: slot.daysOfWeek.filter(d => !updatedSlot.daysOfWeek.includes(d)),
            }
          : slot
      })
      .filter(s => s.daysOfWeek.length > 0)
  }
}