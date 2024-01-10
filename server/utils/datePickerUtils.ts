import { addDays, isValid, parse, subDays, startOfToday } from 'date-fns'
import { formatDate } from './utils'
import DateOption from '../enum/dateOption'

export const parseDatePickerDate = (datePickerDate: string): Date => {
  if (!datePickerDate) return null

  const dateFormatPattern = /(\d{1,2})([-/,. ])(\d{1,2})[-/,. ](\d{2,4})/

  if (!dateFormatPattern.test(datePickerDate)) return new Date(NaN)

  const dateMatches = datePickerDate.match(dateFormatPattern)

  const separator = dateMatches[2]
  const year = dateMatches[4]

  const date = parse(datePickerDate, `dd${separator}MM${separator}${'y'.repeat(year.length)}`, startOfToday())
  if (!isValid(date)) return new Date(NaN)

  return date
}

export const parseIsoDate = (isoDate: string): Date => {
  if (!isoDate) return null
  const date = parse(isoDate, 'yyyy-MM-dd', startOfToday())

  if (!isValid(date)) return new Date(NaN)

  return date
}

export const isValidIsoDate = (isoDate: string) => isValid(parseIsoDate(isoDate))

export const formatDatePickerDate = (date: Date): string => {
  if (!isValid(date)) return null

  return formatDate(date, 'dd/MM/yyyy')
}

export const formatIsoDate = (date: Date): string => {
  if (!isValid(date)) return null

  return formatDate(date, 'yyyy-MM-dd')
}

export const datePickerDateToIsoDate = (datePickerDate: string): string => {
  const date = parseDatePickerDate(datePickerDate)

  return formatIsoDate(date)
}

export const isoDateToDatePickerDate = (isoDate: string): string => {
  const date = parseIsoDate(isoDate)
  return formatDatePickerDate(date)
}

export const dateFromDateOption = (dateOption: DateOption, isoDate?: string) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  switch (dateOption) {
    case DateOption.YESTERDAY:
      return subDays(today, 1)
    case DateOption.TODAY:
      return today
    case DateOption.TOMORROW:
      return addDays(today, 1)
    default:
      return parseIsoDate(isoDate)
  }
}
