import { Expose, Type } from 'class-transformer'
import { IsInt, Max, Min } from 'class-validator'
import { formatDate } from '../utils/utils'

const HOUR_MESSAGE = 'Select a valid hour'
const MINUTE_MESSAGE = 'Select a valid minute'

export default class SimpleTime {
  @Expose()
  @Type(() => Number)
  @IsInt({ message: HOUR_MESSAGE })
  @Min(0, { message: HOUR_MESSAGE })
  @Max(12, { message: HOUR_MESSAGE })
  hour: number

  @Expose()
  @Type(() => Number)
  @IsInt({ message: MINUTE_MESSAGE })
  @Min(0, { message: MINUTE_MESSAGE })
  @Max(59, { message: MINUTE_MESSAGE })
  minute: number

  toDate = () => {
    const date = new Date()
    date.setHours(this.hour, this.minute, 0, 0)
    return date
  }

  toString = () => `${this.hour}:${this.minute}`

  toIsoString = () => formatDate(this.toDate(), 'HH:mm')

  toDisplayString = () => formatDate(this.toDate(), 'HH:mm')
}
