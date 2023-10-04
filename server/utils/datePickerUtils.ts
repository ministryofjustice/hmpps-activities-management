import { isValid, parse } from 'date-fns'
import { formatDate } from './utils'

/**
 * Parse date picker date string to a Date object
 *
 * Valid date picker date strings are in day/month/year format, with either 1 or 2 digits for day and month, and 2 or 4 digits for year
 *
 * Separator can be any of `-/,. `
 *
 * @param datePickerDate
 */
export const parseDatePickerDate = (datePickerDate: string): Date => {
  const dateFormatPattern = /(\d{1,2})([-/,. ])(\d{1,2})[-/,. ](\d{2,4})/

  if (!dateFormatPattern.test(datePickerDate)) return new Date(NaN)

  const dateMatches = datePickerDate.match(dateFormatPattern)

  const separator = dateMatches[2]
  const year = dateMatches[4]

  return parse(datePickerDate, `dd${separator}MM${separator}${'y'.repeat(year.length)}`, new Date())
}

export const parseIsoDate = (isoDate: string): Date => {
  const date = parse(isoDate, 'yyyy-MM-dd', new Date())

  if (!isValid(date)) return new Date(NaN)

  return date
}

export const isValidDatePickerDate = (datePickerDate: string) => isValid(parseDatePickerDate(datePickerDate))

export const isValidIsoDate = (isoDate: string) => isValid(parseIsoDate(isoDate))

export const formatDatePickerDate = (date: Date): string => {
  if (!isValid(date)) return undefined

  return formatDate(date, 'dd/MM/yyyy')
}

export const formatIsoDate = (date: Date): string => {
  if (!isValid(date)) return undefined

  return formatDate(date, 'yyyy-MM-dd')
}

export const datePickerDateToIso = (datePickerDate: string): string => {
  const date = parseDatePickerDate(datePickerDate)

  return formatIsoDate(date)
}

export const isoDateToDatePickerDate = (isoDate: string): string => {
  const date = parseIsoDate(isoDate)

  return formatDatePickerDate(date)
}
