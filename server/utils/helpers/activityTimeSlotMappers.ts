import _, { uniq } from 'lodash'
import TimeSlot from '../../enum/timeSlot'
import { Slots } from '../../routes/activities/create-an-activity/journey'
import { ActivityScheduleSlot, PrisonRegime, Slot } from '../../@types/activitiesAPI/types'
import SimpleTime from '../../commonValidationTypes/simpleTime'
import { DaysAndSlotsInRegime } from './applicableRegimeTimeUtil'
import logger from '../../../logger'

export interface WeeklyTimeSlots {
  [weekNumber: string]: {
    day: string
    slots: TimeSlot[]
  }[]
}

export interface CustomTimeSlot {
  timeSlot: TimeSlot
  startTime: string
  endTime: string
}

export interface WeeklyCustomTimeSlots {
  [weekNumber: string]: {
    day: string
    slots: CustomTimeSlot[]
  }[]
}

export type DayOfWeek =
  | DayOfWeekEnum.MONDAY
  | DayOfWeekEnum.TUESDAY
  | DayOfWeekEnum.WEDNESDAY
  | DayOfWeekEnum.THURSDAY
  | DayOfWeekEnum.FRIDAY
  | DayOfWeekEnum.SATURDAY
  | DayOfWeekEnum.SUNDAY

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export enum DayOfWeekEnum {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

export const timeSlotOrder = {
  [TimeSlot.AM]: 0,
  [TimeSlot.PM]: 1,
  [TimeSlot.ED]: 2,
}

export type SessionSlot = {
  dayOfWeek: string
  timeSlot: TimeSlot
  start: string
  finish: string
}

const toTimeSlot = (timeSlot: string): TimeSlot => TimeSlot[timeSlot as keyof typeof TimeSlot]

export default function activitySessionToDailyTimeSlots(
  scheduleWeeks: number,
  scheduleSlots: { [weekNumber: string]: Slots },
): WeeklyTimeSlots {
  const dailySlots: WeeklyTimeSlots = {}
  for (let weekNumber = 1; weekNumber <= scheduleWeeks; weekNumber += 1) {
    const slots = scheduleSlots[weekNumber] ?? {}

    dailySlots[weekNumber] = daysOfWeek.map(day => ({
      day,
      slots:
        (slots[`timeSlots${day}`] as string[])
          ?.map(timeslot => toTimeSlot(timeslot))
          ?.sort((a, b) => timeSlotOrder[a] - timeSlotOrder[b]) || [],
    }))
  }
  return dailySlots
}

export function customSlotsToSchedule(scheduleWeeks: number, slots: Slot[]): WeeklyCustomTimeSlots {
  const customSlots: WeeklyCustomTimeSlots = {}

  for (let weekNumber = 1; weekNumber <= scheduleWeeks; weekNumber += 1) {
    const slotsForSpecifiedWeek = slots.filter(slot => slot.weekNumber === weekNumber)
    customSlots[weekNumber] = daysOfWeek.map(day => ({
      day,
      slots: getCustomTimeSlotsForDay(day, slotsForSpecifiedWeek),
    }))
  }

  return customSlots
}

export function sessionSlotsToSchedule(
  scheduleWeeks: number,
  sessionSlots: ActivityScheduleSlot[],
): WeeklyCustomTimeSlots {
  const scheduledSlots: WeeklyCustomTimeSlots = {}

  for (let weekNumber = 1; weekNumber <= scheduleWeeks; weekNumber += 1) {
    scheduledSlots[weekNumber] = daysOfWeek.map(day => {
      return { day, slots: [] }
    })
  }

  sessionSlots.forEach(slot => {
    slot.daysOfWeek.forEach(dayOfWeek => {
      const selectedSlot = scheduledSlots[slot.weekNumber].find(customTimeSlot =>
        customTimeSlot.day.startsWith(dayOfWeek),
      )
      selectedSlot.slots.push({
        timeSlot: toTimeSlot(slot.timeSlot),
        startTime: slot.startTime,
        endTime: slot.endTime,
      })
    })
  })

  Object.values(scheduledSlots).forEach(slot =>
    slot.forEach(s => s.slots.sort((a, b) => timeSlotOrder[a.timeSlot] - timeSlotOrder[b.timeSlot])),
  )

  return scheduledSlots
}

export function regimeSlotsToSchedule(
  scheduleWeeks: number,
  selectedSlots: { [weekNumber: string]: Slots },
  regimeTimes: PrisonRegime[],
): WeeklyCustomTimeSlots {
  const scheduledSlots: WeeklyCustomTimeSlots = {}

  for (let weekNumber = 1; weekNumber <= scheduleWeeks; weekNumber += 1) {
    const slots = selectedSlots[weekNumber] ?? {}

    scheduledSlots[weekNumber] = daysOfWeek.map(day => {
      const regimeSlotsForTheDay = regimeTimes.find(t => t.dayOfWeek === day.toUpperCase())
      const selectedSlotsForTheDay = (slots[`timeSlots${day}`] || []) as string[]
      const scheduledSlotsForTheDay: CustomTimeSlot[] = selectedSlotsForTheDay
        .map(selectSlot => {
          const timeSlot = toTimeSlot(selectSlot)
          switch (timeSlot) {
            case TimeSlot.AM: {
              return {
                timeSlot,
                startTime: regimeSlotsForTheDay.amStart,
                endTime: regimeSlotsForTheDay.amFinish,
              }
            }
            case TimeSlot.PM: {
              return {
                timeSlot,
                startTime: regimeSlotsForTheDay.pmStart,
                endTime: regimeSlotsForTheDay.pmFinish,
              }
            }
            case TimeSlot.ED: {
              return {
                timeSlot,
                startTime: regimeSlotsForTheDay.edStart,
                endTime: regimeSlotsForTheDay.edFinish,
              }
            }
            default: {
              logger.warn(`Unknown time slot ${selectSlot}`)
              return null
            }
          }
        })
        .filter(Boolean)

      return {
        day,
        slots: scheduledSlotsForTheDay,
      }
    })
  }

  return scheduledSlots
}

function getCustomTimeSlotsForDay(day: string, slots: Slot[]): CustomTimeSlot[] {
  const timeSlots: CustomTimeSlot[] = []
  slots.forEach(slot => {
    if (slot.daysOfWeek.includes(day.toUpperCase() as DayOfWeek)) {
      timeSlots.push({
        timeSlot: slot.timeSlot as TimeSlot,
        startTime: slot.customStartTime,
        endTime: slot.customEndTime,
      })
    }
  })
  timeSlots.sort((a, b) => timeSlotOrder[a.timeSlot] - timeSlotOrder[b.timeSlot])
  return timeSlots
}

export function mapActivityScheduleSlotsToSlots(activityScheduleSlot: ActivityScheduleSlot[]): Slot[] {
  const mapToDaysOfWeekEnum = (d: string[]): DayOfWeek[] => d.map(day => getFullDayFromAbbreviation(day))

  return activityScheduleSlot.map(input => ({
    weekNumber: input.weekNumber,
    timeSlot: input.timeSlot,
    monday: input.mondayFlag,
    tuesday: input.tuesdayFlag,
    wednesday: input.wednesdayFlag,
    thursday: input.thursdayFlag,
    friday: input.fridayFlag,
    saturday: input.saturdayFlag,
    sunday: input.sundayFlag,
    daysOfWeek: mapToDaysOfWeekEnum(input.daysOfWeek),
  }))
}

export function activitySlotsMinusExclusions(
  exclusions: Slot[],
  activitySlots: ActivityScheduleSlot[],
): ActivityScheduleSlot[] {
  return activitySlots.map(s => {
    const exclusion = exclusions.find(e => e.weekNumber === s.weekNumber && e.timeSlot === s.timeSlot)

    return exclusion
      ? {
          ...s,
          mondayFlag: s.mondayFlag && !exclusion.monday,
          tuesdayFlag: s.tuesdayFlag && !exclusion.tuesday,
          wednesdayFlag: s.wednesdayFlag && !exclusion.wednesday,
          thursdayFlag: s.thursdayFlag && !exclusion.thursday,
          fridayFlag: s.fridayFlag && !exclusion.friday,
          saturdayFlag: s.saturdayFlag && !exclusion.saturday,
          sundayFlag: s.sundayFlag && !exclusion.sunday,
          daysOfWeek: s.daysOfWeek.filter(d => !exclusion.daysOfWeek.includes(getFullDayFromAbbreviation(d))),
        }
      : s
  })
}

const getFullDayFromAbbreviation = (abbrDay: string): DayOfWeek => {
  const daysMap: { [abbr: string]: string } = {
    Mon: 'MONDAY',
    Tue: 'TUESDAY',
    Wed: 'WEDNESDAY',
    Thu: 'THURSDAY',
    Fri: 'FRIDAY',
    Sat: 'SATURDAY',
    Sun: 'SUNDAY',
  }

  return daysMap[abbrDay] as DayOfWeek
}

/**
 * Will return the weeks and days that have slots and include tje scheduled details for the activities slots
 * @param slots The slots selected
 * @param scheduleSlots The scheduled slots for the activity
 * @return Any weeks days and slot which are matched
 */
export function mapSlotsToWeeklyTimeSlots(slots: Slot[], scheduleSlots: ActivityScheduleSlot[]): WeeklyCustomTimeSlots {
  return uniq(slots.map(s => s.weekNumber)).reduce(
    (acc, weekNumber) => ({
      ...acc,
      [weekNumber]: daysOfWeek
        .map(d => d.toUpperCase())
        .map(day => {
          const timeSlots: CustomTimeSlot[] = slots
            .filter(slot => slot.weekNumber === weekNumber && (slot.daysOfWeek as string[]).includes(day))
            .map(slot => {
              const shortDayName: string = _.capitalize(day.substring(0, 3))
              const matchedScheduleSlot = scheduleSlots.find(
                scheduleSlot =>
                  scheduleSlot.weekNumber === slot.weekNumber &&
                  scheduleSlot.timeSlot === slot.timeSlot &&
                  scheduleSlot.daysOfWeek.includes(shortDayName),
              )
              return {
                timeSlot: toTimeSlot(matchedScheduleSlot.timeSlot),
                startTime: matchedScheduleSlot.startTime,
                endTime: matchedScheduleSlot.endTime,
              }
            })

          if (timeSlots.length === 0) return null

          return {
            day,
            slots: timeSlots,
          }
        })
        .filter(a => a),
    }),
    {},
  )
}

// Similar to mapSlotsToWeeklyTimeSlots, but includes empty weeks and days only excluding days without any slots
// across schedule
export function mapSlotsToCompleteWeeklyTimeSlots(slots: Slot[], scheduledWeeks: number): WeeklyTimeSlots {
  return [...Array(scheduledWeeks).keys()]
    .map(v => v + 1)
    .reduce(
      (acc, weekNumber) => ({
        ...acc,
        [weekNumber]: daysOfWeek
          .map(d => d.toUpperCase())
          .map(day => {
            const timeSlots = slots
              .filter(slot => slot.weekNumber === weekNumber)
              .filter(s => (s.daysOfWeek as string[]).includes(day))
              .map(slot => slot.timeSlot as TimeSlot)

            if (timeSlots.length === 0 && !slots.find(s => s.daysOfWeek.includes(day as DayOfWeek))) return null
            return {
              day,
              slots: timeSlots,
            }
          })
          .filter(a => a),
      }),
      {},
    )
}

export function calculateUniqueSlots(slotsA: Slot[], slotsB: Slot[]): Slot[] {
  return slotsA
    .map(slot => {
      const updatedSlot = slotsB.find(us => us.weekNumber === slot.weekNumber && us.timeSlot === slot.timeSlot)
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

export function calculateExclusionSlots(exclusions: Slot[], updatedExclusions: Slot[]): Slot[] {
  const addedSlots: Slot[] = []

  exclusions.forEach(exclusion => {
    const filteredExclusions = updatedExclusions.filter(
      e => e.timeSlot === exclusion.timeSlot && e.weekNumber === exclusion.weekNumber,
    )
    const days: ('MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY')[] =
      exclusion.daysOfWeek

    const daysToAdd: ('MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY')[] = []
    days.forEach(day => {
      const dayNotFound = filteredExclusions.filter(s => s.daysOfWeek.includes(day)).length === 0
      if (dayNotFound) {
        daysToAdd.push(day)
      }
    })
    if (daysToAdd.length > 0) {
      const slot: Slot = {
        weekNumber: exclusion.weekNumber,
        timeSlot: exclusion.timeSlot,
        customStartTime: exclusion.customStartTime,
        customEndTime: exclusion.customEndTime,
        monday: daysToAdd.includes('MONDAY'),
        tuesday: daysToAdd.includes('TUESDAY'),
        wednesday: daysToAdd.includes('WEDNESDAY'),
        thursday: daysToAdd.includes('THURSDAY'),
        friday: daysToAdd.includes('FRIDAY'),
        saturday: daysToAdd.includes('SATURDAY'),
        sunday: daysToAdd.includes('SUNDAY'),
        daysOfWeek: daysToAdd,
      }
      addedSlots.push(slot)
    }
  })

  return addedSlots
}

// merge exclusions on timeslot & week
export function mergeExclusionSlots(exclusions: Slot[]): Slot[] {
  const mergeSlots: Slot[] = []

  exclusions.forEach(exclusion => {
    const filteredExclusions = exclusions.filter(
      e => e.weekNumber === exclusion.weekNumber && e.timeSlot === exclusion.timeSlot,
    )

    if (filteredExclusions.length === 1) {
      mergeSlots.push(exclusion)
    } else if (filteredExclusions.length > 1) {
      // check it's present
      const added = mergeSlots.find(
        merged => merged.weekNumber === exclusion.weekNumber && merged.timeSlot === exclusion.timeSlot,
      )
      if (added) {
        const days: ('MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY')[] =
          exclusion.daysOfWeek

        const daysToAdd: ('MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY')[] = []
        days.forEach(day => {
          if (!added.daysOfWeek.includes(day)) {
            daysToAdd.push(day)
          }
        })
        if (daysToAdd.length > 0) {
          added.monday = added.monday || daysToAdd.includes('MONDAY')
          added.tuesday = added.tuesday || daysToAdd.includes('TUESDAY')
          added.wednesday = added.wednesday || daysToAdd.includes('WEDNESDAY')
          added.thursday = added.thursday || daysToAdd.includes('THURSDAY')
          added.friday = added.friday || daysToAdd.includes('FRIDAY')
          added.saturday = added.saturday || daysToAdd.includes('SATURDAY')
          added.sunday = added.sunday || daysToAdd.includes('SUNDAY')
          added.daysOfWeek.push(...daysToAdd)
        }
      } else {
        mergeSlots.push(exclusion)
      }
    }
  })
  return mergeSlots
}

export function createCustomSlots(startTimes: Map<string, SimpleTime>, endTimes: Map<string, SimpleTime>): Slot[] {
  const customSlots: Slot[] = []

  startTimes.forEach((value, key) => {
    const slot: Slot = createSlot(key, value, endTimes.get(key))
    customSlots.push(slot)
  })

  return customSlots
}

export function createSlot(daySlot: string, startTime: SimpleTime, endTime: SimpleTime): Slot {
  const [week, day, timeSlot] = daySlot.split('-') as [string, DayOfWeek, TimeSlot]

  const slot: Slot = {
    customStartTime: startTime.toIsoString(),
    customEndTime: endTime.toIsoString(),
    daysOfWeek: [day],
    monday: day === 'MONDAY',
    tuesday: day === 'TUESDAY',
    wednesday: day === 'WEDNESDAY',
    thursday: day === 'THURSDAY',
    friday: day === 'FRIDAY',
    saturday: day === 'SATURDAY',
    sunday: day === 'SUNDAY',
    timeSlot,
    weekNumber: Number(week),
  }
  return slot
}

export function transformActivitySlotsToDailySlots(activitySlots: ActivityScheduleSlot[]): DaysAndSlotsInRegime[] {
  const transformedSlots: { [key: string]: DaysAndSlotsInRegime } = {}

  activitySlots.forEach((slot: ActivityScheduleSlot) => {
    slot.daysOfWeek.forEach((abbreviation: string) => {
      const dayOfWeek = getFullDayFromAbbreviation(abbreviation)

      if (!transformedSlots[dayOfWeek]) {
        transformedSlots[dayOfWeek] = {
          dayOfWeek,
        }
      }
      if (slot.timeSlot === TimeSlot.AM) {
        transformedSlots[dayOfWeek].amStart = slot.startTime
        transformedSlots[dayOfWeek].amFinish = slot.endTime
      } else if (slot.timeSlot === TimeSlot.PM) {
        transformedSlots[dayOfWeek].pmStart = slot.startTime
        transformedSlots[dayOfWeek].pmFinish = slot.endTime
      } else if (slot.timeSlot === TimeSlot.ED) {
        transformedSlots[dayOfWeek].edStart = slot.startTime
        transformedSlots[dayOfWeek].edFinish = slot.endTime
      }
    })
  })

  return Object.values(transformedSlots)
}

export function createSessionSlots(applicableRegimeTimesForActivity: DaysAndSlotsInRegime[]): SessionSlot[] {
  const sessionSlots: SessionSlot[] = []
  applicableRegimeTimesForActivity.forEach(day => {
    if (day.amStart) {
      sessionSlots.push({
        dayOfWeek: day.dayOfWeek,
        timeSlot: TimeSlot.AM,
        start: day.amStart,
        finish: day.amFinish,
      })
    }
    if (day.pmStart) {
      sessionSlots.push({
        dayOfWeek: day.dayOfWeek,
        timeSlot: TimeSlot.PM,
        start: day.pmStart,
        finish: day.pmFinish,
      })
    }
    if (day.edStart) {
      sessionSlots.push({
        dayOfWeek: day.dayOfWeek,
        timeSlot: TimeSlot.ED,
        start: day.edStart,
        finish: day.edFinish,
      })
    }
  })

  return sessionSlots
}

export function filterNotRequiredSlots(
  existingSlots: DaysAndSlotsInRegime[],
  newlySelectedSlots: Slots,
): DaysAndSlotsInRegime[] {
  const dailySlots: { [day: string]: DaysAndSlotsInRegime } = {}

  existingSlots.forEach(slot => {
    const day = slot.dayOfWeek.toLowerCase()
    if (!newlySelectedSlots.days.includes(day)) {
      return
    }

    const selectedTimeSlots = newlySelectedSlots[`timeSlots${_.capitalize(day)}` as keyof Slots]

    if (!dailySlots[day]) {
      dailySlots[day] = { dayOfWeek: slot.dayOfWeek }
    }

    const currentSlot = dailySlots[day]

    if (slot.amStart && slot.amFinish && selectedTimeSlots.includes('AM')) {
      currentSlot.amStart = slot.amStart
      currentSlot.amFinish = slot.amFinish
    }

    if (slot.pmStart && slot.pmFinish && selectedTimeSlots.includes('PM')) {
      currentSlot.pmStart = slot.pmStart
      currentSlot.pmFinish = slot.pmFinish
    }

    if (slot.edStart && slot.edFinish && selectedTimeSlots.includes('ED')) {
      currentSlot.edStart = slot.edStart
      currentSlot.edFinish = slot.edFinish
    }
  })

  return Object.values(dailySlots)
}

export function addNewEmptySlotsIfRequired(sessionSlots: SessionSlot[], newlySelectedSlots: Slots): SessionSlot[] {
  if (newlySelectedSlots === undefined) {
    return []
  }
  // Make the day format match
  const days = newlySelectedSlots.days.map(day => day.toUpperCase())

  days.forEach(day => {
    const timeSlotsKey = `timeSlots${_.capitalize(day)}` as keyof Slots
    const timeSlots = newlySelectedSlots[timeSlotsKey]

    timeSlots.forEach((slot: string) => {
      const slotExists = sessionSlots.some(item => item.dayOfWeek === day && item.timeSlot === slot)

      if (!slotExists) {
        // Add missing slot with undefined start and finish times
        sessionSlots.push({
          dayOfWeek: day,
          timeSlot: slot as TimeSlot,
          start: undefined,
          finish: undefined,
        })
      }
    })
  })

  return sessionSlots
}

export function sortSlots(sessionSlots: SessionSlot[]) {
  const dayOfWeekOrder: { [key in DayOfWeekEnum]: number } = {
    [DayOfWeekEnum.MONDAY]: 0,
    [DayOfWeekEnum.TUESDAY]: 1,
    [DayOfWeekEnum.WEDNESDAY]: 2,
    [DayOfWeekEnum.THURSDAY]: 3,
    [DayOfWeekEnum.FRIDAY]: 4,
    [DayOfWeekEnum.SATURDAY]: 5,
    [DayOfWeekEnum.SUNDAY]: 6,
  }

  return sessionSlots.sort((a, b) => {
    const dayComparison =
      dayOfWeekOrder[a.dayOfWeek as keyof typeof DayOfWeekEnum] -
      dayOfWeekOrder[b.dayOfWeek as keyof typeof DayOfWeekEnum]
    if (dayComparison !== 0) {
      return dayComparison
    }
    return timeSlotOrder[a.timeSlot] - timeSlotOrder[b.timeSlot]
  })
}

export function getMatchingSlots(existingSlots: DaysAndSlotsInRegime[], newlySelectedSlots: Slots): SessionSlot[] {
  // remove slots we don't want anymore
  const filteredSlots: DaysAndSlotsInRegime[] = filterNotRequiredSlots(existingSlots, newlySelectedSlots)
  // convert to sessionSlots for ease
  const filteredSessionSlots: SessionSlot[] = createSessionSlots(filteredSlots)
  // add empty slots for new times to be added
  const emptySlotsAdded: SessionSlot[] = addNewEmptySlotsIfRequired(filteredSessionSlots, newlySelectedSlots)
  // Sort the days and slots
  return sortSlots(emptySlotsAdded)
}
