/* eslint-disable @typescript-eslint/no-explicit-any,dot-notation */
import enGBLocale, {
  areIntervalsOverlapping,
  endOfDay,
  format,
  formatISO,
  isAfter,
  isBefore,
  isSameDay,
  isToday,
  isTomorrow,
  isYesterday,
  parse,
  parseISO,
} from 'date-fns'
import { ValidationError } from 'class-validator'
import _ from 'lodash'
import { FieldValidationError } from '../middleware/validationMiddleware'
import { Prisoner } from '../@types/prisonerOffenderSearchImport/types'
import { Activity, ActivitySchedule, Attendance, ScheduledEvent, Slot } from '../@types/activitiesAPI/types'
import TimeSlot from '../enum/timeSlot'
// eslint-disable-next-line import/no-cycle
import { CreateAnActivityJourney } from '../routes/activities/create-an-activity/journey'

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const properCase = (word: string): string =>
  word.length >= 1 ? word[0].toUpperCase() + word.toLowerCase().slice(1) : word

export const isBlank = (str: string): boolean => !str || /^\s*$/.test(str)

/**
 * Converts a name (first name, last name, middle name, etc.) to proper case equivalent, handling double-barreled names
 * correctly (i.e. each part in a double-barreled is converted to proper case).
 * @param name name to be converted.
 * @returns name converted to proper case.
 */
const properCaseName = (name: string): string => (isBlank(name) ? '' : name.split('-').map(properCase).join('-'))

export const convertToTitleCase = (sentence: string): string =>
  isBlank(sentence) ? '' : sentence.split(' ').map(properCaseName).join(' ')

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
 * Converts a prisoner name from 'firstName lastName' format to
 * "lastName, firstName" and bolds prisoner lastName
 */
export const prisonerName = (name: string, boldLastName = true) => {
  if (!name) return null
  const nameParts = name.split(' ')
  const firstNames = nameParts.slice(0, nameParts.length - 1)

  let formattedName = nameParts[nameParts.length - 1]
  if (boldLastName) formattedName = `<strong>${formattedName}</strong>`
  formattedName += `, ${firstNames.join(' ')}`
  return formattedName
}

export const parseDate = (date: string, fromFormat = 'yyyy-MM-dd') => {
  if (!date) return null
  return parse(date, fromFormat, new Date())
}

export const parseISODate = (date: string) => {
  if (!date) return null
  return parseISO(date)
}

export const switchDateFormat = (displayDate: string, fromFormat = 'dd/MM/yyyy') => {
  if (displayDate) {
    return formatISO(parse(displayDate, fromFormat, new Date(), { locale: enGBLocale }), { representation: 'date' })
  }
  return displayDate
}

export const getCurrentPeriod = (hour: number): string => {
  const afternoonSplit = 12
  const eveningSplit = 17
  if (hour < afternoonSplit) return 'AM'
  if (hour < eveningSplit) return 'PM'
  return 'ED'
}

export const getTimeSlotFromTime = (time: string): TimeSlot => {
  const hour = +time.split(':')[0]
  const afternoonSplit = 12
  const eveningSplit = 17
  if (hour < afternoonSplit) return TimeSlot.AM
  if (hour < eveningSplit) return TimeSlot.PM
  return TimeSlot.ED
}

export const startsWithAny = (string: string, list: string[]): boolean => {
  return list.find(s => string.startsWith(s)) !== undefined
}

// Assumes date is iso format yyyy-MM-dd
// Note we use local date times for comparison here - fine as long as both are
export const isAfterToday = (date: string): boolean => {
  const dateMidnight = parse(date, 'yyyy-MM-dd', new Date())
  const endOfToday = endOfDay(new Date())
  return isAfter(dateMidnight, endOfToday)
}

// Assumes date is iso format yyyy-MM-dd (no time element)
export const isTodayOrBefore = (date: string): boolean => {
  const dateMidnight = parseDate(date)
  const endOfToday = endOfDay(new Date())
  return isBefore(dateMidnight, endOfToday)
}

export const sortByDateTime = (t1: string, t2: string): number => {
  if (t1 && t2) return parseISO(t1).getTime() - parseISO(t2).getTime()
  if (t1) return -1
  if (t2) return 1
  return 0
}

export const compare = (field: string, reverse: boolean, primer: (x: any) => any) => {
  const key = primer ? (x: { [x: string]: any }) => primer(x[field]) : (x: { [x: string]: any }) => x[field]
  const r = !reverse ? 1 : -1

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return (left, right) => {
    const a = key(left)
    const b = key(right)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return r * ((a > b) - (b > a))
  }
}

export const compareStrings = (l: string, r: string): number => l.localeCompare(r, 'en', { ignorePunctuation: true })

export const comparePrisoners = (field: string, reverse: boolean) => {
  let key: (x: Prisoner) => string | number
  switch (field) {
    case 'name':
      key = (x: Prisoner) => [x.lastName.trim(), x.firstName.trim(), x.middleNames].join(' ').toLowerCase()
      break
    case 'prisonNumber':
      key = (x: Prisoner) => x.prisonerNumber
      break
    case 'location':
      key = (x: Prisoner) => x.cellLocation
      break
    default:
      key = (x: Prisoner) => x[field]
  }
  const r = !reverse ? 1 : -1

  return (left: Prisoner, right: Prisoner) => {
    const a: string | number = key(left)
    const b: string | number = key(right)
    return r * (a < b ? -1 : 1)
  }
}

export const removeBlanks = (array: unknown[]) => array.filter((item: unknown) => !!item)

export const setSelected = (items: any, selected: any) =>
  items &&
  items.map((entry: { value: string }) => ({
    ...entry,
    selected: entry && entry.value === selected,
  }))

export const addDefaultSelectedValue = (items: any, text: any, show: any) => {
  if (!items) return null
  const attributes: { hidden?: string } = {}
  if (!show) attributes.hidden = ''

  return [
    {
      text,
      value: '',
      selected: true,
      attributes,
    },
    ...items,
  ]
}

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

export const existsInStringArray = (key: string, arr: string[]): boolean => {
  return arr?.find(item => item === key) !== undefined
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

export const eventClashes = (event: ScheduledEvent, thisEvent: { startTime: string; endTime?: string }) => {
  const timeToDate = (time: string) => parse(time, 'HH:mm', new Date())
  const toInterval = (start: Date, end: Date) => ({ start, end })

  return areIntervalsOverlapping(
    toInterval(
      timeToDate(event.startTime),
      event.endTime ? timeToDate(event.endTime) : endOfDay(timeToDate(event.startTime)),
    ),
    toInterval(
      timeToDate(thisEvent.startTime),
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
      slotMap.get(timeSlot)[day] = true
    }

    daysOfWeek.forEach(day => {
      fromSlots[weekNumber][`timeSlots${day}`]?.forEach((slot: string) => setSlot(slot, day.toLowerCase()))
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
      days: daysOfWeek.filter(d => weekSlots.find(s => s[`${d.toLowerCase()}Flag`])).map(d => d.toLowerCase()),
    }

    daysOfWeek.forEach(d => {
      const timeslots = weekSlots.filter(s => s[`${d.toLowerCase()}Flag`]).map(s => getTimeSlotFromTime(s.startTime))
      slots[week][`timeSlots${d}`] = timeslots.map(t => t.toUpperCase())
    })
  })

  return slots
}

// Maybe we could update our session object to match the activity model so this conversion isn't needed?
export const mapActivityModelPayToJourney = (pay: Activity['pay']): CreateAnActivityJourney['pay'] =>
  pay.map(p => ({
    incentiveNomisCode: p.incentiveNomisCode,
    incentiveLevel: p.incentiveLevel,
    rate: p.rate,
    bandId: p.prisonPayBand.id,
    bandAlias: p.prisonPayBand.alias,
    displaySequence: p.prisonPayBand.displaySequence,
  }))

export const padNumber = (num: number, length = 2) => {
  return (new Array(length).fill('0').join('') + num).slice(-length)
}

export const setAttribute = (object: { [key: string]: string }, key: string, value: string) => {
  const newObject = { ...object, [key]: value }
  return newObject
}

export const removeUndefined = (arr: object[]) => arr.filter(Boolean)

export const getScheduleIdFromActivity = (activity: Activity) => activity.schedules[0].id

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
