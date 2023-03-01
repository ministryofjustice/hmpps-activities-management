import { Expose, plainToInstance, Type } from 'class-transformer'
import { IsInt, Max, Min } from 'class-validator'
import { getDate, getMonth, getYear, isValid, parse } from 'date-fns'
import { formatDate } from '../utils/utils'

const DAY_MESSAGE = 'Enter a valid day'
const MONTH_MESSAGE = 'Enter a valid month'
const YEAR_MESSAGE = 'Enter a valid year'

export default class SimpleDate {
  @Expose()
  @Type(() => Number)
  @IsInt({ message: DAY_MESSAGE })
  @Min(1, { message: DAY_MESSAGE })
  @Max(31, { message: DAY_MESSAGE })
  day: number

  @Expose()
  @Type(() => Number)
  @IsInt({ message: MONTH_MESSAGE })
  @Min(1, { message: MONTH_MESSAGE })
  @Max(12, { message: MONTH_MESSAGE })
  month: number

  @Expose()
  @Type(() => Number)
  @IsInt({ message: YEAR_MESSAGE })
  @Min(1, { message: YEAR_MESSAGE })
  @Min(1000, { message: 'Year must be entered in the format YYYY' })
  year: number

  toRichDate = () => parse(this.toString(), 'yyyy-MM-dd', new Date())

  toString = () => `${this.year}-${this.month}-${this.day}`

  toIsoString = () => formatDate(this.toRichDate(), 'yyyy-MM-dd')
}

export const simpleDateFromDate = (date: Date) => {
  if (date && isValid(date)) {
    return plainToInstance(SimpleDate, {
      day: getDate(date),
      month: getMonth(date) + 1, // Translate zero indexed month to one indexed
      year: getYear(date),
    })
  }

  return null
}
