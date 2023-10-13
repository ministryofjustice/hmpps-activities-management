import { addDays, isValid, parse, subDays } from 'date-fns'
import { formatDate } from './utils'
import DateOption from '../enum/dateOption'

export const parseDatePickerDate = (datePickerDate: string): Date => {
  const dateFormatPattern = /(\d{1,2})([-/,. ])(\d{1,2})[-/,. ](\d{2,4})/

  if (!dateFormatPattern.test(datePickerDate)) return null

  const dateMatches = datePickerDate.match(dateFormatPattern)

  const separator = dateMatches[2]
  const year = dateMatches[4]

  const date = parse(datePickerDate, `dd${separator}MM${separator}${'y'.repeat(year.length)}`, new Date())
  if (!isValid(date)) return null

  return date
}

export const parseIsoDate = (isoDate: string): Date => {
  const date = parse(isoDate, 'yyyy-MM-dd', new Date())

  if (!isValid(date)) return null

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

export const datePickerDateToIsoDate = (datePickerDate: string): string => {
  const date = parseDatePickerDate(datePickerDate)

  return formatIsoDate(date)
}

export const isoDateToDatePickerDate = (isoDate: string): string => {
  const date = parseIsoDate(isoDate)

  return formatDatePickerDate(date)
}

export const dateFromDateOption = (dateOption: DateOption, isoDate?: string) => {
  switch (dateOption) {
    case DateOption.YESTERDAY:
      return subDays(new Date(), 1)
    case DateOption.TODAY:
      return new Date()
    case DateOption.TOMORROW:
      return addDays(new Date(), 1)
    default:
      return parseIsoDate(isoDate)
  }
}
