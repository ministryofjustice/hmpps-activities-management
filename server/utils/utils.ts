/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line import/no-duplicates
import { parse, formatISO, isAfter, parseISO, endOfDay, format, isSameDay } from 'date-fns'
// eslint-disable-next-line import/no-duplicates
import enGBLocale from 'date-fns/locale/en-GB'
import { ValidationError } from 'class-validator'
import { FieldValidationError } from '../middleware/validationMiddleware'
import { Prisoner } from '../@types/prisonerOffenderSearchImport/types'
import { Attendance } from '../@types/activitiesAPI/types'

const properCase = (word: string): string =>
  word.length >= 1 ? word[0].toUpperCase() + word.toLowerCase().slice(1) : word

const isBlank = (str: string): boolean => !str || /^\s*$/.test(str)

/**
 * Converts a name (first name, last name, middle name, etc.) to proper case equivalent, handling double-barreled names
 * correctly (i.e. each part in a double-barreled is converted to proper case).
 * @param name name to be converted.
 * @returns name converted to proper case.
 */
const properCaseName = (name: string): string => (isBlank(name) ? '' : name.split('-').map(properCase).join('-'))

export const convertToTitleCase = (sentence: string): string =>
  isBlank(sentence) ? '' : sentence.split(' ').map(properCaseName).join(' ')

export const initialiseName = (fullName?: string): string | null => {
  // this check is for the authError page
  if (!fullName) return null

  const array = fullName.split(' ')
  return `${array[0][0]}. ${array.reverse()[0]}`
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

export const getTimeSlotFromTime = (time: string): string => {
  const hour = +time.split(':')[0]
  const afternoonSplit = 12
  const eveningSplit = 17
  if (hour < afternoonSplit) return 'AM'
  if (hour < eveningSplit) return 'PM'
  return 'ED'
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

export const formatDate = (date: Date, fmt: string) => {
  return format(date, fmt)
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

export const existsInStringArray = (key: string, arr: string[]): boolean => {
  return arr?.find(item => item === key) !== undefined
}

export const getAttendanceSummary = (attendance: Attendance[]) => {
  const allocated = attendance.length
  const attended = attendance.filter(a => a.status === 'COMPLETED' && a.attendanceReason.code === 'ATT').length
  const notAttended = attendance.filter(a => a.status === 'COMPLETED' && a.attendanceReason.code !== 'ATT').length
  const notRecorded = allocated - attended - notAttended

  return { allocated, attended, notAttended, notRecorded }
}

export const toMoney = (x: number): string => `£${(x / 100).toFixed(2)}`
