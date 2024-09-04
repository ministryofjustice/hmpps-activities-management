import { Request, Response } from 'express'
import { ValidateNested } from 'class-validator'
import { plainToInstance, Transform } from 'class-transformer'
import _ from 'lodash'
import ActivitiesService from '../../../../services/activitiesService'
import getApplicableDaysAndSlotsInRegime, {
  DaysAndSlotsInRegime,
} from '../../../../utils/helpers/applicableRegimeTimeUtil'
import { Slots } from '../journey'
import { ActivityUpdateRequest, PrisonRegime, Slot } from '../../../../@types/activitiesAPI/types'
import TimeSlot from '../../../../enum/timeSlot'
import SimpleTime from '../../../../commonValidationTypes/simpleTime'
import {
  createCustomSlots,
  DayOfWeekEnum,
  timeSlotOrder,
  transformActivitySlotsToDailySlots,
} from '../../../../utils/helpers/activityTimeSlotMappers'
import { ServiceUser } from '../../../../@types/express'

export type SessionSlot = {
  dayOfWeek: string
  timeSlot: TimeSlot
  start: string
  finish: string
}

export class SessionTimes {
  @Transform(({ value }) =>
    Object.keys(value).reduce((acc, k) => acc.set(k, plainToInstance(SimpleTime, value[k])), new Map()),
  )
  @ValidateNested()
  startTimes: Map<string, SimpleTime>

  @Transform(({ value }) =>
    Object.keys(value).reduce((acc, k) => acc.set(k, plainToInstance(SimpleTime, value[k])), new Map()),
  )
  @ValidateNested()
  endTimes: Map<string, SimpleTime>
}

function createSessionSlots(applicableRegimeTimesForActivity: DaysAndSlotsInRegime[]): SessionSlot[] {
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

export function getMatchingSlots(existingSlots: DaysAndSlotsInRegime[], newlySelectedSlots: Slots): SessionSlot[] {
  // remove slots we don't want anymore
  const filteredSlots = filterUnrequiredSlots(existingSlots, newlySelectedSlots)
  // convert to sessionSlots for ease
  const filteredSessionSlots = createSessionSlots(filteredSlots)
  // add empty slots for new times to be added
  const emptySlotsAdded = addNewEmptySlotsIfRequired(filteredSessionSlots, newlySelectedSlots)
  // Sort the days and slots
  return sortSlots(emptySlotsAdded)
}

export function filterUnrequiredSlots(
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

export function addNewEmptySlotsIfRequired(sessionSlots: SessionSlot[], newlySelectedSlots: Slots): SessionSlot[] {
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

function startDateBeforeEarlierSession(customSlot: Slot, allSlots: Slot[]): boolean {
  // no need to check if it's AM
  if (customSlot.timeSlot === TimeSlot.AM) {
    return false
  }
  const amSlotStartTime: string = allSlots.find(
    slot => slot.timeSlot === TimeSlot.AM && _.isEqual(slot.daysOfWeek, customSlot.daysOfWeek),
  )?.customStartTime

  // check any PM or ED session is after any AM start time
  if (
    amSlotStartTime !== undefined &&
    ((customSlot.timeSlot === TimeSlot.PM && customSlot.customStartTime.localeCompare(amSlotStartTime) <= 0) ||
      (customSlot.timeSlot === TimeSlot.ED && customSlot.customStartTime.localeCompare(amSlotStartTime) <= 0))
  ) {
    return true
  }

  const pmSlotStartTime: string = allSlots.find(
    slot => slot.timeSlot === TimeSlot.PM && _.isEqual(slot.daysOfWeek, customSlot.daysOfWeek),
  )?.customStartTime

  // check an ED session is after any PM start time
  if (
    pmSlotStartTime !== undefined &&
    customSlot.timeSlot === TimeSlot.ED &&
    customSlot.customStartTime.localeCompare(pmSlotStartTime) <= 0
  ) {
    return true
  }
  return false
}

export default class SessionTimesRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const regimeTimes = await this.activitiesService.getPrisonRegime(user.activeCaseLoadId, user)
    const { activityId, slots, scheduleWeeks } = req.session.createJourney

    const sessionSlots = await this.getDaysAndSlotsByWeek(
      regimeTimes,
      slots,
      scheduleWeeks,
      req.params.mode === 'edit',
      +activityId,
      user,
    )

    res.render(`pages/activities/create-an-activity/session-times`, {
      sessionSlots,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { activityId, name, scheduleWeeks } = req.session.createJourney
    const { startTimes, endTimes }: SessionTimes = req.body
    const { preserveHistory } = req.query

    const startTimesObj = Array.from(startTimes.keys()).reduce((acc, key) => {
      acc[key] = startTimes.get(key)
      return acc
    }, {})

    const endTimesObj = Array.from(endTimes.keys()).reduce((acc, key) => {
      acc[key] = endTimes.get(key)
      return acc
    }, {})
    req.body.startTimes = startTimesObj
    req.body.endTimes = endTimesObj

    const customSlots: Slot[] = createCustomSlots(startTimes, endTimes)

    // validate slots
    const slotsWithStartAfterEnd: Slot[] = customSlots.filter(
      (customSlot: Slot) => customSlot.customStartTime.localeCompare(customSlot.customEndTime) >= 0,
    )
    if (slotsWithStartAfterEnd.length > 0) {
      slotsWithStartAfterEnd.forEach(customSlot => {
        res.addValidationError(
          `endTimes-${customSlot.weekNumber}-${customSlot.daysOfWeek}-${customSlot.timeSlot}`,
          'Select an end time after the start time',
        )
      })
      return res.validationFailed()
    }

    const slotsStartingBeforeEarlierSession: Slot[] = customSlots.filter((customSlot: Slot) =>
      startDateBeforeEarlierSession(customSlot, customSlots),
    )
    if (slotsStartingBeforeEarlierSession.length > 0) {
      slotsStartingBeforeEarlierSession.forEach(customSlot => {
        res.addValidationError(
          `startTimes-${customSlot.weekNumber}-${customSlot.daysOfWeek}-${customSlot.timeSlot}`,
          'Start time must be after the earlier session start time',
        )
      })
      return res.validationFailed()
    }

    req.session.createJourney.customSlots = customSlots

    if (req.params.mode === 'edit') {
      const activity = {
        slots: req.session.createJourney.customSlots,
        scheduleWeeks,
      } as ActivityUpdateRequest
      await this.activitiesService.updateActivity(activityId, activity, user)
      const successMessage = `You've updated the daily schedule for ${name}`
      return res.redirectWithSuccess(`/activities/view/${activityId}`, 'Activity updated', successMessage)
    }

    if (preserveHistory === 'true') {
      return res.redirect('check-answers')
    }

    return res.redirectOrReturn(`bank-holiday-option`)
  }

  private getDaysAndSlotsByWeek = async (
    regimeTimes: PrisonRegime[],
    slots: { [p: string]: Slots },
    scheduleWeeks: number,
    editModeActive: boolean,
    activityId: number,
    user: ServiceUser,
  ): Promise<Map<string, DaysAndSlotsInRegime[] | SessionSlot[]>> => {
    const sessionSlots = new Map<string, DaysAndSlotsInRegime[] | SessionSlot[]>()

    if (editModeActive) {
      const activity = await this.activitiesService.getActivity(activityId, user)
      const activitySchedule = activity.schedules[0]
      const existingSlots = transformActivitySlotsToDailySlots(activitySchedule.slots)
      return sessionSlots.set('1', getMatchingSlots(existingSlots, slots['1']))
    }

    for (let weekNumber = 1; weekNumber <= scheduleWeeks; weekNumber += 1) {
      const applicableRegimeTimesForActivity: DaysAndSlotsInRegime[] = getApplicableDaysAndSlotsInRegime(
        regimeTimes,
        slots[weekNumber.toString()],
      )
      sessionSlots.set(weekNumber.toString(), createSessionSlots(applicableRegimeTimesForActivity))
    }

    return sessionSlots
  }

  private getDaysAndSlots = async (
    regimeTimes: PrisonRegime[],
    slots: Slots,
    editModeActive: boolean,
    activityId: number,
    user: ServiceUser,
  ): Promise<DaysAndSlotsInRegime[]> => {
    if (editModeActive) {
      const activity = await this.activitiesService.getActivity(activityId, user)
      const activitySchedule = activity.schedules[0]
      const existingSlots = transformActivitySlotsToDailySlots(activitySchedule.slots)
      return getMatchingSlots(existingSlots, slots)
    }
    const applicableRegimeTimesForActivity: DaysAndSlotsInRegime[] = getApplicableDaysAndSlotsInRegime(
      regimeTimes,
      slots,
    )
    return createSessionSlots(applicableRegimeTimesForActivity)
  }
}
