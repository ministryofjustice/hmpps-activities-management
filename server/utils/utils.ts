// eslint-disable-next-line import/no-duplicates
import { parse, formatISO, isAfter, parseISO } from 'date-fns'
// eslint-disable-next-line import/no-duplicates
import enGBLocale from 'date-fns/locale/en-GB'

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

// Assumes date is iso format yyyy-MM-dd
// Note we use UTC date times for comparison here - fine as long as both are
export const isAfterToday = (date: string): boolean => {
  const dateMidnight = parse(date, 'yyyy-MM-dd', new Date())
  const now = new Date()
  const tonightMidnight = now.setHours(24, 0, 0, 0)
  return isAfter(dateMidnight, tonightMidnight)
}

export const sortByDateTime = (t1: string, t2: string): number => {
  if (t1 && t2) return parseISO(t1).getTime() - parseISO(t2).getTime()
  if (t1) return -1
  if (t2) return 1
  return 0
}
