import { Expose, Type } from 'class-transformer'
import { IsInt, Max, Min } from 'class-validator'
import { formatDate } from '../utils/utils'

const HOUR_MESSAGE = 'Select an hour'
const MINUTE_MESSAGE = 'Select a minute'

export default class SimpleTime {
  @Expose()
  @Type(() => Number)
  @IsInt({ message: HOUR_MESSAGE })
  @Min(0, { message: HOUR_MESSAGE })
  @Max(23, { message: HOUR_MESSAGE })
  hour: number

  @Expose()
  @Type(() => Number)
  @IsInt({ message: MINUTE_MESSAGE })
  @Min(0, { message: MINUTE_MESSAGE })
  @Max(59, { message: MINUTE_MESSAGE })
  minute: number

  toDate = (baseDate?: Date) => {
    const date = baseDate ? new Date(baseDate) : new Date()
    date.setHours(this.hour, this.minute, 0, 0)
    return date
  }

  toString = () => `${this.hour}:${this.minute}`

  toIsoString = () => formatDate(this.toDate(), 'HH:mm')
}
