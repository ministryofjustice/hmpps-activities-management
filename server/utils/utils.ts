/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  addDays,
  areIntervalsOverlapping,
  endOfDay,
  format,
  isSameDay,
  isToday,
  isTomorrow,
  isYesterday,
  parse,
  parseISO,
  set,
  startOfDay,
  subDays,
} from 'date-fns'
import { enGB } from 'date-fns/locale/en-GB'
import { ValidationError } from 'class-validator'
import _ from 'lodash'
import { FieldValidationError } from '../middleware/validationMiddleware'
import {
  Activity,
  ActivitySchedule,
  AdvanceAttendance,
  Attendance,
  ScheduledEvent,
  Slot,
} from '../@types/activitiesAPI/types'
import { CreateAnActivityJourney, Slots } from '../routes/activities/create-an-activity/journey'
import { NameFormatStyle } from './helpers/nameFormatStyle'
import DateOption from '../enum/dateOption'
import { Prisoner } from '../@types/activities'
import config from '../config'

export type DaysOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'
export const DAYS_OF_WEEK: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export const DAYS_OF_WEEK_UPPERCASE: DaysOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]

export const isBlank = (str: string): boolean => !str || /^\s*$/.test(str)

/**
 * Converts an unformatted name string to the format, 'J. Bloggs'.
 * Specifically, this method initialises the first name and appends it by the last name. Any middle names are stripped.
 * @param name name to be converted.
 * @returns name converted to initialised format.
 */
export const initialiseName = (fullName?: string): string | null => {
  // this check is for the authError page
  if (!fullName) return null

  const array = fullName.split(' ')
  return `${array[0][0]}. ${array.reverse()[0]}`
}

/**
 * Converts a user object containing firstName, lastName and middleNames to a full name string.
 * @param user user to extract full name from
 * @returns name string
 */
export const fullName = (user?: { firstName: string; lastName: string; middleNames?: string }): string | null => {
  if (!user || user.lastName === 'UNKNOWN') return null
  return [user.firstName, user.middleNames, user.lastName]
    .filter(part => part)
    .reduce((parts, part) => `${parts} ${part}`, '')
    .trim()
}

/**
 * Converts a user object containing firstName & lastName to a "firstName lastName" string.
 * @param user user to extract full name from
 * @returns name string
 */
export const firstNameLastName = (user?: { firstName: string; lastName: string }): string | null => {
  if (!user) return null
  return `${user.firstName} ${user.lastName}`
}

/**
 * Format a person's name with proper capitalisation
 *
 * Correctly handles names with apostrophes, hyphens and spaces
 *
 * @param firstName - first name
 * @param middleNames - middle names
 * @param lastName - last name
 * @param nameFormatStyle: how the name is to be formatted,
 * @param boldLastName: whether the last name is bold
 * @returns formatted name string
 */
export const formatName = (
  firstName: string,
  middleNames: string,
  lastName: string,
  nameFormatStyle: NameFormatStyle,
  boldLastName: boolean = true,
): string => {
  const names = [firstName, middleNames, lastName]
  if (nameFormatStyle === NameFormatStyle.lastCommaFirstMiddle) {
    names.unshift(`${names.pop()},`)
  } else if (nameFormatStyle === NameFormatStyle.lastCommaFirst) {
    names.unshift(`${names.pop()},`)
    names.pop() // Remove middleNames
  } else if (nameFormatStyle === NameFormatStyle.firstLast) {
    names.splice(1, 1)
  }
  const namesOrdered = names
    .filter(s => s)
    .map(s => s.toLowerCase().trim())
    .join(' ')
    .replace(/(^\w)|([\s'-]+\w)/g, letter => letter.toUpperCase())

  if (
    boldLastName &&
    (nameFormatStyle === NameFormatStyle.lastCommaFirstMiddle || nameFormatStyle === NameFormatStyle.lastCommaFirst)
  ) {
    const [surname, ...rest] = namesOrdered.split(', ')
    return `<strong>${surname}</strong>, ${rest.join(' ')}`
  }

  return namesOrdered
}

/**
 * Clean wrapper for formatName that formats a name as "First Last" (i.e. first name and last name only).
 *
 * Correctly handles names with apostrophes, hyphens and spaces
 *
 * @param firstName - first name
 * @param lastName - last name
 * @returns formatted name string
 */
export const formatFirstLastName = (firstName: string, lastName: string): string =>
  formatName(firstName, undefined, lastName, NameFormatStyle.firstLast, false)

/**
 * Clean wrapper for formatName that formats a string to title case
 *
 * @param input - string to be formatted
 * @returns formatted string
 */
export const formatStringToTitleCase = (input: string): string =>
  formatName(input, undefined, undefined, NameFormatStyle.firstLast, false)

export const parseDate = (date: string, fromFormat = 'yyyy-MM-dd') => {
  if (!date) return null
  return parse(date, fromFormat, new Date())
}

export const dateAtTime = (date: Date, time: Date): Date =>
  set(date, { hours: time.getHours(), minutes: time.getMinutes() })

export const parseISODate = (date: string) => {
  if (!date) return null
  return parseISO(date)
}

export const simplifyTime = (time: string): string => {
  const splitTime = time.split(':')
  return `${splitTime[0]}:${splitTime[1]}`
}

export const compareStrings = (l: string, r: string): number => l.localeCompare(r, 'en', { ignorePunctuation: true })

export const toTimeItems = (array: string[], selected: number) => {
  if (!array) return null

  const items = [
    {
      value: '-',
      text: '--',
      selected: false,
    },
  ]

  array.forEach(item => {
    const timeValue = parseInt(item, 10)
    const value = Number.isNaN(timeValue) ? item : timeValue.toString()
    items.push({
      value,
      text: item,
      selected: selected !== undefined && selected !== null && value === selected.toString(),
    })
  })

  return items
}

export const findError = (array: FieldValidationError[], formFieldId: string) => {
  if (!array) return null
  const item = array.find(error => error.field === formFieldId)
  if (item) {
    return {
      text: item.message,
    }
  }
  return null
}

export const buildErrorSummaryList = (array: FieldValidationError[]) => {
  if (!array) return null
  return array.map((error: FieldValidationError) => ({
    text: error.message,
    href: `#${error.field}`,
  }))
}

export const concatArrays = (a: unknown[], b: unknown[]) => {
  return [...a, ...b]
}

export const formatDate = (date: unknown, fmt = 'EEEE, d MMMM yyyy', inContextName = false) => {
  if (!date) return null

  let richDate = date as Date
  if (typeof date === 'string') {
    richDate = parseDate(date as string)
  }

  if (inContextName) {
    if (isToday(richDate)) {
      return 'today'
    }
    if (isTomorrow(richDate)) {
      return 'tomorrow'
    }
    if (isYesterday(richDate)) {
      return 'yesterday'
    }
  }
  return format(richDate, fmt)
}

export const dateInList = (date: Date, dates: Date[]) => {
  return dates.some(d => isSameDay(date, d))
}

export const associateErrorsWithProperty = (error: ValidationError) => {
  return Object.values(error.constraints).map(err => ({
    property: error.property,
    error: err,
  }))
}

export const toDateString = (date: Date) => format(date, 'yyyy-MM-dd')

export const toDate = (date: string) => parse(date, 'yyyy-MM-dd', new Date())

export const sliceArray = (arr: Array<unknown>, start: number, end: number) => arr?.slice(start, end)

export const getAdvancedAttendanceSummary = (
  attendance: Attendance[],
  advanceAttendances?: AdvanceAttendance[],
  total?: number,
) => {
  const attendanceCount = total ?? attendance.length

  const attended = attendance.filter(a => a.status === 'COMPLETED' && a.attendanceReason?.code === 'ATTENDED').length
  let notAttended = attendance.filter(a => a.status === 'COMPLETED' && a.attendanceReason?.code !== 'ATTENDED').length
  if (config.notRequiredInAdvanceEnabled) {
    notAttended += advanceAttendances.length
  }
  const notRecorded = attendanceCount - attended - notAttended

  const attendedPercentage = '-'
  let notAttendedPercentage = '-'
  const notRecordedPercentage = '-'
  if (attendanceCount > 0) {
    notAttendedPercentage = toFixed((notAttended / attendanceCount) * 100, 0)
  }

  return {
    attendanceCount,
    attended,
    notAttended,
    notRecorded,
    attendedPercentage,
    notAttendedPercentage,
    notRecordedPercentage,
  }
}

export const getAttendanceSummary = (attendance: Attendance[]) => {
  const attendanceCount = attendance.length
  const attended = attendance.filter(a => a.status === 'COMPLETED' && a.attendanceReason?.code === 'ATTENDED').length
  const notAttended = attendance.filter(a => a.status === 'COMPLETED' && a.attendanceReason?.code !== 'ATTENDED').length
  const notRecorded = attendanceCount - attended - notAttended
  let attendedPercentage = '-'
  let notAttendedPercentage = '-'
  let notRecordedPercentage = '-'
  if (attendanceCount > 0) {
    attendedPercentage = toFixed((attended / attendanceCount) * 100, 0)
    notAttendedPercentage = toFixed((notAttended / attendanceCount) * 100, 0)
    notRecordedPercentage = toFixed((notRecorded / attendanceCount) * 100, 0)
  }

  return {
    attendanceCount,
    attended,
    notAttended,
    notRecorded,
    attendedPercentage,
    notAttendedPercentage,
    notRecordedPercentage,
  }
}

export const toFixed = (num: number, decimals = 2) => {
  if (!num && num !== 0) return null
  return num.toFixed(decimals)
}

export const toMoney = (x: number): string => `£${(x / 100).toFixed(2)}`

export const convertToArray = (maybeArray: string | string[]): string[] => {
  return maybeArray ? [maybeArray].flat() : []
}

export const asString = (value: unknown): string => {
  const v = Array.isArray(value) ? value[0] : value
  return v != null ? `${v}` : ''
}

export const convertToNumberArray = (maybeArray: string | string[]): number[] => {
  return convertToArray(maybeArray)
    .map(item => (Number.isNaN(+item) ? null : +item))
    .filter(item => item)
}

export const eventClashes = (otherEvent: ScheduledEvent, thisEvent: { startTime?: string; endTime?: string }) => {
  const timeToDate = (time: string) => parse(time, 'HH:mm', new Date())
  const toInterval = (start: Date, end: Date) => ({ start, end })

  // If either is has no start and end times then assume a potential clash
  if (!otherEvent.startTime && !otherEvent.endTime) return true
  if (!thisEvent.startTime && !thisEvent.endTime) return true

  return areIntervalsOverlapping(
    toInterval(
      otherEvent.startTime ? timeToDate(otherEvent.startTime) : startOfDay(timeToDate(otherEvent.endTime)),
      otherEvent.endTime ? timeToDate(otherEvent.endTime) : endOfDay(timeToDate(otherEvent.startTime)),
    ),
    toInterval(
      thisEvent.startTime ? timeToDate(thisEvent.startTime) : startOfDay(timeToDate(thisEvent.endTime)),
      thisEvent.endTime ? timeToDate(thisEvent.endTime) : endOfDay(timeToDate(thisEvent.startTime)),
    ),
  )
}

export const mapJourneySlotsToActivityRequest = (fromSlots: CreateAnActivityJourney['slots']): Slot[] => {
  const slots: Slot[] = []

  Object.keys(fromSlots).forEach(weekNumber => {
    const slotMap: Map<string, Slot> = new Map()
    const setSlot = (timeSlot: string, day: string) => {
      if (!slotMap.has(timeSlot)) {
        slotMap.set(timeSlot, { weekNumber: +weekNumber, timeSlot } as Slot)
      }
      slotMap.get(timeSlot)[day as keyof Slots] = true
    }

    DAYS_OF_WEEK.forEach(day => {
      fromSlots[weekNumber][`timeSlots${day}` as keyof Slots]?.forEach((slot: string) =>
        setSlot(slot, day.toLowerCase()),
      )
    })

    slotMap.forEach(slot => slots.push(slot))
  })
  return slots
}

export const mapActivityModelSlotsToJourney = (
  fromSlots: ActivitySchedule['slots'],
): CreateAnActivityJourney['slots'] => {
  const slots: CreateAnActivityJourney['slots'] = {}

  const weekNumbers = _.uniq(fromSlots.map(s => s.weekNumber))
  weekNumbers.forEach(week => {
    const weekSlots = fromSlots.filter(s => s.weekNumber === week)
    slots[week] = {
      days: DAYS_OF_WEEK.filter(d => weekSlots.find(s => s[`${d.toLowerCase()}Flag`])).map(d => d.toLowerCase()),
    }

    DAYS_OF_WEEK.forEach(d => {
      const timeslots = weekSlots.filter(s => s[`${d.toLowerCase()}Flag`]).map(s => s.timeSlot)
      slots[week][`timeSlots${d}`] = timeslots.map(t => t.toUpperCase())
    })
  })

  return slots
}

export const padNumber = (num: number, length = 2) => {
  return (new Array(length).fill('0').join('') + num).slice(-length)
}

export const setAttribute = (object: { [key: string]: string }, key: string, value: string) => {
  return { ...object, [key]: value }
}

export const removeUndefined = (arr: object[]) => arr.filter(Boolean)

export const getScheduleIdFromActivity = (activity: Activity) => activity.schedules[0].id

export const getAllocationStartDateFromActivity = (activity: Activity, id: number) =>
  activity.schedules[0].allocations.filter(allocation => allocation.id === id)[0].startDate

// Events should be sorted by time, then event name (summary)
export const scheduledEventSort = (data: ScheduledEvent[]): ScheduledEvent[] => {
  return data.sort((p1, p2) => {
    if (p1.startTime < p2.startTime) return -1
    if (p1.startTime > p2.startTime) return 1
    if (p1.summary.toLowerCase() < p2.summary.toLowerCase()) return -1
    if (p1.summary.toLowerCase() > p2.summary.toLowerCase()) return 1
    return 0
  })
}

export const filterObjects = (objects: object[], iteratee: string, eq: unknown): object[] =>
  objects.filter(o => o[iteratee as keyof any] === eq)

export const filterNot = (objects: object[], iteratee: string, notEq: unknown): object[] =>
  objects.filter(o => o[iteratee as keyof any] !== notEq)

export const excludeArrayObject = (objects: object[], iteratee: object): object[] => {
  return objects.filter(o => o !== iteratee)
}

// Anything with a number is considered not to be a name, so therefore an identifier (prison no, PNC no etc.)
export const isPrisonerIdentifier = (searchTerm: string): boolean => /\d/.test(searchTerm)

export const simpleTimeToDate = (time: { hour: string; minute: string }): Date =>
  time && (time.hour || time.minute)
    ? parse(`${time.hour}:${time.minute}`, 'HH:mm', new Date(0), { locale: enGB })
    : null

export const getSplitTime = (time: string) => {
  if (time === '-')
    return {
      hour: '-',
      minute: '-',
    }
  if (!time) return undefined
  const splitTime = time.split(':')
  return {
    hour: splitTime[0][0] === '0' ? splitTime[0][1] : splitTime[0],
    minute: splitTime[1][0] === '0' ? splitTime[1][1] : splitTime[1],
  }
}

export const getSelectedDate = form => {
  if (form.datePresetOption === DateOption.TODAY) return new Date()
  if (form.datePresetOption === DateOption.TOMORROW) return addDays(new Date(), 1)
  if (form.datePresetOption === DateOption.YESTERDAY) return subDays(new Date(), 1)
  return form.date
}

export const getDateFromDateAndTimeFormat = (date: Date): string => {
  return date.toISOString().split('T')[0]
}

export const getDatePresetOptionWithYesterday = (date: string): DateOption => {
  if (date === undefined) return null
  if (date === getDateFromDateAndTimeFormat(new Date())) return DateOption.TODAY
  if (date === getDateFromDateAndTimeFormat(subDays(new Date(), 1))) return DateOption.YESTERDAY
  return DateOption.OTHER
}

export const getDatePresetOptionWithTomorrow = (date: string): DateOption => {
  if (date === undefined) return null
  if (date === getDateFromDateAndTimeFormat(new Date())) return DateOption.TODAY
  if (date === getDateFromDateAndTimeFormat(addDays(new Date(), 1))) return DateOption.TOMORROW
  return DateOption.OTHER
}

type AppointmentSearchResult = {
  appointmentAttendeeId: number
  prisonerNumber: string
  bookingId: number
}

export const getSortableItemForAttendee = (
  attendees: AppointmentSearchResult[],
  prisonersDetails: { [prisonerNumber: string]: Prisoner },
) => {
  if (attendees.length === 1) {
    const prisoner = prisonersDetails[attendees[0].prisonerNumber]
    if (prisoner) {
      return formatName(
        prisoner.firstName,
        prisoner.middleNames,
        prisoner.lastName,
        NameFormatStyle.lastCommaFirstMiddle,
        false,
      )
    }
  }
  return attendees.length
}
